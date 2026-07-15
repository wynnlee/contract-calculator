import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ConfigProvider,
  InputNumber,
  Select,
  Button,
  Card,
  Table,
  Statistic,
  Space,
  Typography,
  Tag,
  Grid,
  Message,
  Tooltip,
  Switch,
  Radio,
} from '@arco-design/web-react';
import {
  IconCopy,
  IconSunFill,
  IconMoonFill,
  IconFile,
  IconClose,
  IconSafe,
  IconCalendarClock,
  IconCheckCircle,
} from '@arco-design/web-react/icon';
import '@arco-design/web-react/dist/css/arco.css';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import { numberToChinese, formatNumber } from './utils/numberToChinese';
import './App.css';

const { Title, Text } = Typography;
const { Row, Col } = Grid;

/** Tiny copy button — inline with text */
function CopyBtn({ text, label }) {
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(text));
      Message.success({ content: `${label || '已'}复制成功`, duration: 1500 });
    } catch {
      Message.error({ content: '复制失败，请手动复制', duration: 1500 });
    }
  }, [text, label]);

  if (text === undefined || text === null || text === '') return null;

  return (
    <Tooltip content={`复制${label || ''}`}>
      <Button
        type="text"
        size="mini"
        icon={<IconCopy />}
        onClick={copy}
        className="copy-btn"
      />
    </Tooltip>
  );
}

/** Amount display with copy button */
function AmountWithCopy({ value, formatted, chinese, bold, color }) {
  return (
    <span className="amount-with-copy">
      <span className="amount-value">
        <Text bold={bold} style={{ fontFamily: 'monospace', fontSize: 15, color }}>
          {formatted}
        </Text>
        <CopyBtn text={formatted ? formatted.replace(/^¥/, '') : value} label="金额" />
      </span>
      {chinese && (
        <span className="amount-chinese">
          <Text style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{chinese}</Text>
          <CopyBtn text={chinese} label="大写" />
        </span>
      )}
    </span>
  );
}

/** Chinese uppercase badge pill */
function ChineseBadge({ text }) {
  if (!text) return null;
  return (
    <span className="chinese-badge">
      {text}
      <CopyBtn text={text} label="大写" />
    </span>
  );
}

const TAX_RATE_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '1%', value: 0.01 },
  { label: '3%', value: 0.03 },
  { label: '6%', value: 0.06 },
  { label: '9%', value: 0.09 },
  { label: '13%', value: 0.13 },
];

const PRESET_RATIOS = [
  ['10%', '20%', '30%', '40%'],
  ['30%', '30%', '40%'],
  ['30%', '70%'],
  ['50%', '50%'],
];

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('arco-theme') || 'light');
  const [unitPrice, setUnitPrice] = useState(null);
  const [quantity, setQuantity] = useState(null);
  const [taxRate, setTaxRate] = useState(0.13);
  const [ratioInputs, setRatioInputs] = useState(['30', '70']);
  const [unit, setUnit] = useState('yuan');

  // Convert internal amount (in 元) to display amount based on selected unit
  const disp = useCallback((amount) => unit === 'wan' ? amount / 10000 : amount, [unit]);
  // Format for display: 万元 strips trailing zeros, 元 keeps 2 decimals
  const fmt = useCallback((amount) => {
    const val = disp(amount);
    if (unit === 'wan') {
      // Strip trailing zeros after decimal
      const parts = val.toFixed(4).split('.');
      const intStr = Number(parts[0]).toLocaleString('zh-CN');
      const decStr = parts[1].replace(/0+$/, '');
      return decStr ? `${intStr}.${decStr}` : intStr;
    }
    return formatNumber(val);
  }, [unit, disp]);
  // Dynamic precision for Statistic component
  const getPrecision = useCallback((amount) => {
    if (unit === 'yuan') return 2;
    const val = amount / 10000;
    const dec = val.toFixed(4).split('.')[1].replace(/0+$/, '');
    return dec.length;
  }, [unit]);

  // When unit changes, convert unitPrice to match the new unit
  const prevUnit = useRef(unit);
  useEffect(() => {
    if (prevUnit.current !== unit && unitPrice !== null) {
      setUnitPrice(unit === 'wan' ? unitPrice / 10000 : unitPrice * 10000);
    }
    prevUnit.current = unit;
  }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme to document
  useEffect(() => {
    document.body.setAttribute('arco-theme', theme);
    localStorage.setItem('arco-theme', theme);
  }, [theme]);

  // Calculate totals — unitPrice is tax-inclusive, in the currently selected unit
  const totals = useMemo(() => {
    // Convert input price to 元 for internal calculation
    const price = (unitPrice || 0) * (unit === 'wan' ? 10000 : 1);
    const qty = quantity || 0;
    const tax = taxRate || 0;

    const amountIncludingTax = price * qty;
    const amountExcludingTax = tax > 0 ? amountIncludingTax / (1 + tax) : amountIncludingTax;
    const taxAmount = amountIncludingTax - amountExcludingTax;

    const installments = ratioInputs.map((r) => {
      const ratio = parseFloat(r) || 0;
      const includingTaxAmount = amountIncludingTax * (ratio / 100);
      const excludingTaxAmount = amountExcludingTax * (ratio / 100);
      const taxPortion = taxAmount * (ratio / 100);
      return {
        ratio,
        excludingTaxAmount,
        taxPortion,
        includingTaxAmount,
        chineseExcludingTax: numberToChinese(excludingTaxAmount),
        chineseIncludingTax: numberToChinese(includingTaxAmount),
      };
    });

    return {
      amountExcludingTax,
      taxAmount,
      amountIncludingTax,
      chineseExcludingTax: numberToChinese(amountExcludingTax),
      chineseIncludingTax: numberToChinese(amountIncludingTax),
      installments,
    };
  }, [unitPrice, quantity, taxRate, ratioInputs]);

  // Check if ratios sum to 100%
  const ratioSum = ratioInputs.reduce((sum, r) => sum + (parseFloat(r) || 0), 0);
  const ratioValid = Math.abs(ratioSum - 100) < 0.01;
  const hasAnyRatio = ratioInputs.some((r) => r !== '');

  const hasData = (unitPrice || 0) > 0 && (quantity || 0) > 0;

  const addRatio = () => {
    setRatioInputs([...ratioInputs, '']);
  };

  const removeRatio = (index) => {
    if (ratioInputs.length <= 1) return;
    const newInputs = ratioInputs.filter((_, i) => i !== index);
    setRatioInputs(newInputs);
  };

  const updateRatio = (index, value) => {
    const newInputs = [...ratioInputs];
    newInputs[index] = value === undefined ? '' : String(value);
    setRatioInputs(newInputs);
  };

  const applyPreset = (preset) => {
    setRatioInputs(preset.map((p) => p.replace('%', '')));
  };

  const installmentColumns = [
    {
      title: '付款比例',
      dataIndex: 'ratio',
      width: 140,
      render: (val, record, idx) => (
        <div className="ratio-cell">
          <Text type="secondary" style={{ fontSize: 12 }}>第 {idx + 1} 期</Text>
          <Tag color="arcoblue" size="large">
            {val}%
          </Tag>
        </div>
      ),
    },
    {
      title: unit === 'wan' ? '含税金额 (万元)' : '含税金额 (元)',
      dataIndex: 'includingTaxAmount',
      width: 250,
      render: (val, record) => (
        <AmountWithCopy
          value={val}
          formatted={`¥${fmt(val)}`}
          chinese={record.chineseIncludingTax}
          bold
          color="rgb(var(--arcoblue-6))"
        />
      ),
    },
    {
      title: unit === 'wan' ? '不含税金额 (万元)' : '不含税金额 (元)',
      dataIndex: 'excludingTaxAmount',
      width: 250,
      render: (val, record) => (
        <AmountWithCopy
          value={val}
          formatted={`¥${fmt(val)}`}
          chinese={record.chineseExcludingTax}
          bold
        />
      ),
    },
  ];

  return (
    <ConfigProvider locale={zhCN}>
      <div className="app-container">
        {/* Floating theme toggle */}
        <div className="theme-toggle">
          <IconSunFill style={{ fontSize: 15, color: theme === 'light' ? 'rgb(var(--orange-6))' : 'var(--color-text-3)' }} />
          <Switch
            checked={theme === 'dark'}
            onChange={(v) => setTheme(v ? 'dark' : 'light')}
            size="small"
          />
          <IconMoonFill style={{ fontSize: 15, color: theme === 'dark' ? 'rgb(var(--arcoblue-6))' : 'var(--color-text-3)' }} />
        </div>

        <div className="app-wrapper">
          {/* Hero Header */}
          <header className="hero">
            <Title heading={2} className="hero-title">
              合同金额与分期计算器
            </Title>
            <Text type="secondary" className="hero-subtitle" style={{ display: 'block', marginTop: 8 }}>
              输入合同参数，自动计算含税/不含税金额及各期款项
            </Text>
          </header>

          <div className="app-divider" />

          {/* Input Section */}
          <Card className="input-card">
            {/* Step 1: Contract Parameters */}
            <div className="input-section-label">
              合同参数
              <Radio.Group
                value={unit}
                onChange={setUnit}
                size="small"
                style={{ marginLeft: 12 }}
              >
                <Radio value="yuan">元</Radio>
                <Radio value="wan">万元</Radio>
              </Radio.Group>
            </div>
            <Row gutter={[24, 16]} align="center">
              <Col xs={24} sm={12} md={8}>
                <div className="input-group">
                  <Text className="input-label">含税单价 ({unit === 'wan' ? '万元' : '元'})</Text>
                  <InputNumber
                    value={unitPrice}
                    onChange={setUnitPrice}
                    placeholder="请输入单价"
                    min={0}
                    precision={2}
                    size="large"
                    style={{ width: '100%' }}
                    prefix="¥"
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="input-group">
                  <Text className="input-label">数量</Text>
                  <InputNumber
                    value={quantity}
                    onChange={setQuantity}
                    placeholder="请输入数量"
                    min={0}
                    precision={0}
                    size="large"
                    style={{ width: '100%' }}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="input-group">
                  <Text className="input-label">税率</Text>
                  <Select
                    value={taxRate}
                    onChange={setTaxRate}
                    options={TAX_RATE_OPTIONS}
                    size="large"
                    style={{ width: '100%' }}
                  />
                </div>
              </Col>
            </Row>

            {/* Step 2: Installment Plan */}
            <div className="input-section-label" style={{ marginTop: 24 }}>付款计划</div>
            <div className={`ratio-section ${hasAnyRatio ? (ratioValid ? 'valid' : 'invalid') : ''}`}>
              <Text className="input-label" style={{ marginBottom: 12 }}>
                付款分期比例
                {hasAnyRatio && (
                  ratioValid ? (
                    <span className="ratio-status">
                      <span className="dot matched" />
                      <Text type="success" style={{ fontSize: 12 }}>已匹配 100%</Text>
                    </span>
                  ) : (
                    <span className="ratio-status">
                      <span className="dot mismatched" />
                      <Text type="error" style={{ fontSize: 12 }}>合计 {ratioSum.toFixed(2)}%，需等于 100%</Text>
                    </span>
                  )
                )}
              </Text>
              <Space direction="vertical" style={{ width: '100%' }}>
                {ratioInputs.map((val, idx) => (
                  <div key={idx} className="ratio-row">
                    <InputNumber
                      value={val === '' ? undefined : parseFloat(val)}
                      onChange={(v) => updateRatio(idx, v)}
                      placeholder={`第 ${idx + 1} 期比例`}
                      min={0}
                      max={100}
                      precision={2}
                      size="large"
                      style={{ flex: 1 }}
                      suffix="%"
                    />
                    <Button
                      type="text"
                      status="danger"
                      onClick={() => removeRatio(idx)}
                      disabled={ratioInputs.length <= 1}
                      className="remove-btn"
                      icon={<IconClose />}
                    />
                  </div>
                ))}
                <Space wrap>
                  <Button type="outline" size="small" onClick={addRatio}>
                    + 添加付款期
                  </Button>
                  {PRESET_RATIOS.map((preset, idx) => (
                    <Button
                      key={idx}
                      type="text"
                      size="small"
                      onClick={() => applyPreset(preset)}
                      className="preset-btn"
                    >
                      {preset.join(' + ')}
                    </Button>
                  ))}
                </Space>
              </Space>
            </div>
          </Card>

          <div className="app-divider" />

          {/* Results Section */}
          {hasData ? (
            <div className="results-section">
              <Title heading={4} style={{ marginBottom: 18 }}>
                计算结果
              </Title>

              {/* Summary Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: 36 }}>
                <Col xs={24} md={8}>
                  <Card className="summary-card highlight-card">
                    <div className="card-header">
                      <IconSafe className="card-header-icon" style={{ color: 'rgb(var(--arcoblue-6))' }} />
                      <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>含税总金额</Text>
                    </div>
                    <div className="statistic-row">
                      <Statistic
                        value={disp(totals.amountIncludingTax)}
                        precision={getPrecision(totals.amountIncludingTax)}
                        prefix="¥"
                        groupSeparator
                        styleValue={{ fontSize: 28, fontWeight: 700, color: 'rgb(var(--arcoblue-6))' }}
                      />
                      <CopyBtn text={fmt(totals.amountIncludingTax)} label="金额" />
                    </div>
                    <ChineseBadge text={totals.chineseIncludingTax} />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card className="summary-card tax-card">
                    <div className="card-header">
                      <IconCalendarClock className="card-header-icon" style={{ color: 'rgb(var(--orange-6))' }} />
                      <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>税额</Text>
                    </div>
                    <div className="statistic-row">
                      <Statistic
                        value={disp(totals.taxAmount)}
                        precision={getPrecision(totals.taxAmount)}
                        prefix="¥"
                        groupSeparator
                        styleValue={{ fontSize: 28, fontWeight: 700, color: 'rgb(var(--orange-6))' }}
                      />
                      <CopyBtn text={fmt(totals.taxAmount)} label="金额" />
                    </div>
                    <ChineseBadge text={numberToChinese(totals.taxAmount)} />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card className="summary-card exclude-card">
                    <div className="card-header">
                      <IconCheckCircle className="card-header-icon" style={{ color: 'rgb(var(--green-6))' }} />
                      <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>不含税金额</Text>
                    </div>
                    <div className="statistic-row">
                      <Statistic
                        value={disp(totals.amountExcludingTax)}
                        precision={getPrecision(totals.amountExcludingTax)}
                        prefix="¥"
                        groupSeparator
                        styleValue={{ fontSize: 28, fontWeight: 700 }}
                      />
                      <CopyBtn text={fmt(totals.amountExcludingTax)} label="金额" />
                    </div>
                    <ChineseBadge text={totals.chineseExcludingTax} />
                  </Card>
                </Col>
              </Row>

              {/* Installment Details */}
              <Card className="installment-card">
                <Title heading={5} style={{ marginBottom: 16 }}>
                  分期明细
                </Title>
                <Table
                  columns={installmentColumns}
                  data={totals.installments}
                  pagination={false}
                  rowKey="ratio"
                  border={{ wrapper: true, cell: true }}
                  stripe
                  scroll={{ x: 660 }}
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row>
                        <Table.Summary.Cell>
                          <Text bold>合计</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell>
                          <AmountWithCopy
                            value={totals.amountIncludingTax}
                            formatted={`¥${fmt(totals.amountIncludingTax)}`}
                            chinese={totals.chineseIncludingTax}
                            bold
                            color="rgb(var(--arcoblue-6))"
                          />
                        </Table.Summary.Cell>
                        <Table.Summary.Cell>
                          <AmountWithCopy
                            value={totals.amountExcludingTax}
                            formatted={`¥${fmt(totals.amountExcludingTax)}`}
                            chinese={totals.chineseExcludingTax}
                            bold
                          />
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </Card>
            </div>
          ) : (
            /* Empty state */
            <div className="empty-state">
              <IconFile className="empty-state-icon" style={{ color: 'var(--color-text-3)' }} />
              <Text className="empty-state-text">
                请在上方输入合同参数，计算结果将在此显示
              </Text>
            </div>
          )}

          {/* Footer */}
          <div className="app-footer">
            <Text type="secondary" style={{ fontSize: 12 }}>
              计算结果仅供参考，实际金额以合同约定为准
            </Text>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default App;
