import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  Select,
  Card,
  Table,
  Title,
  Tag,
  Tooltip,
  Radio,
  Notification,
  Icon,
  Typewriter,
  Wallet,
} from 'animal-island-ui';
import 'animal-island-ui/dist/index.css';
import { numberToChinese, formatNumber } from './utils/numberToChinese';
import bgImg from '/bg.jpg';
import './App.css';

/* ── Helpers ── */

const TAX_RATE_OPTIONS = [
  { key: '0', label: '0%' },
  { key: '0.01', label: '1%' },
  { key: '0.03', label: '3%' },
  { key: '0.06', label: '6%' },
  { key: '0.09', label: '9%' },
  { key: '0.13', label: '13%' },
];

const PRESET_RATIOS = [
  ['10%', '20%', '30%', '40%'],
  ['30%', '30%', '40%'],
  ['30%', '70%'],
  ['50%', '50%'],
];

/** Tiny copy button */
function CopyBtn({ text }) {
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(text));
      Notification.success({ message: '复制成功', duration: 1.5 });
    } catch {
      Notification.error({ message: '复制失败，请手动复制', duration: 1.5 });
    }
  }, [text]);

  if (text === undefined || text === null || text === '') return null;

  return (
    <Tooltip title="复制" variant="island">
      <Button type="text" size="small" onClick={copy} className="copy-btn" aria-label="复制">
        <Icon name="icon-camera" size={14} />
      </Button>
    </Tooltip>
  );
}

/** Chinese uppercase badge */
function ChineseBadge({ text }) {
  if (!text) return null;
  return (
    <span className="chinese-badge">
      {text}
      <CopyBtn text={text} />
    </span>
  );
}

/** Amount display with copy buttons */
function AmountWithCopy({ value, formatted, chinese, bold, color }) {
  return (
    <span className="amount-with-copy">
      <span className="amount-value">
        <span className="amount-num" style={{ fontWeight: bold ? 700 : 400, color }}>{formatted}</span>
        <CopyBtn text={formatted ? formatted.replace(/^¥/, '') : value} />
      </span>
      {chinese && (
        <span className="amount-chinese">
          <span className="amount-cn">{chinese}</span>
          <CopyBtn text={chinese} />
        </span>
      )}
    </span>
  );
}

/* ── Main App ── */

function App() {
  const [unitPrice, setUnitPrice] = useState(null);
  const [quantity, setQuantity] = useState(null);
  const [taxRate, setTaxRate] = useState('0.13');
  const [ratioInputs, setRatioInputs] = useState(['30', '70']);
  const [unit, setUnit] = useState('yuan');
  const [tableLoading, setTableLoading] = useState(false);

  // Display helpers
  const disp = useCallback((amount) => unit === 'wan' ? amount / 10000 : amount, [unit]);
  const fmt = useCallback((amount) => {
    const val = disp(amount);
    if (unit === 'wan') {
      const parts = val.toFixed(4).split('.');
      const intStr = Number(parts[0]).toLocaleString('zh-CN');
      const decStr = parts[1].replace(/0+$/, '');
      return decStr ? `${intStr}.${decStr}` : intStr;
    }
    return formatNumber(val);
  }, [unit, disp]);
  const getPrecision = useCallback((amount) => {
    if (unit === 'yuan') return 2;
    const val = amount / 10000;
    const dec = val.toFixed(4).split('.')[1].replace(/0+$/, '');
    return dec.length;
  }, [unit]);

  // Unit price conversion
  const prevUnit = useRef(unit);
  useEffect(() => {
    if (prevUnit.current !== unit && unitPrice !== null) {
      setUnitPrice(unit === 'wan' ? unitPrice / 10000 : unitPrice * 10000);
    }
    prevUnit.current = unit;
  }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculations
  const tax = parseFloat(taxRate) || 0;
  const totals = useMemo(() => {
    const price = (unitPrice || 0) * (unit === 'wan' ? 10000 : 1);
    const qty = quantity || 0;

    const amountIncludingTax = price * qty;
    const amountExcludingTax = tax > 0 ? amountIncludingTax / (1 + tax) : amountIncludingTax;
    const taxAmount = amountIncludingTax - amountExcludingTax;

    const installments = ratioInputs.map((r) => {
      const ratio = parseFloat(r) || 0;
      const includingTaxAmount = amountIncludingTax * (ratio / 100);
      const excludingTaxAmount = amountExcludingTax * (ratio / 100);
      const taxPortion = taxAmount * (ratio / 100);
      return {
        key: ratio,
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
  }, [unitPrice, quantity, tax, ratioInputs, unit]);

  const ratioSum = ratioInputs.reduce((sum, r) => sum + (parseFloat(r) || 0), 0);
  const ratioValid = Math.abs(ratioSum - 100) < 0.01;
  const hasAnyRatio = ratioInputs.some((r) => r !== '');
  const hasData = (unitPrice || 0) > 0 && (quantity || 0) > 0;

  // Simulate loading when data changes
  const prevDataKey = useRef('');
  const dataKey = `${unitPrice}-${quantity}-${taxRate}-${ratioInputs.join(',')}-${unit}`;
  useEffect(() => {
    if (prevDataKey.current !== dataKey && hasData) {
      setTableLoading(true);
      const t = setTimeout(() => setTableLoading(false), 400);
      prevDataKey.current = dataKey;
      return () => clearTimeout(t);
    }
    prevDataKey.current = dataKey;
  }, [dataKey, hasData]);

  const addRatio = () => setRatioInputs([...ratioInputs, '']);
  const removeRatio = (index) => {
    if (ratioInputs.length <= 1) return;
    setRatioInputs(ratioInputs.filter((_, i) => i !== index));
  };
  const updateRatio = (index, raw) => {
    const newInputs = [...ratioInputs];
    newInputs[index] = raw === undefined || raw === '' ? '' : String(raw);
    setRatioInputs(newInputs);
  };
  const applyPreset = (preset) => setRatioInputs(preset.map((p) => p.replace('%', '')));

  // Table columns
  const installmentColumns = [
    {
      title: '付款比例',
      dataIndex: 'ratio',
      width: 140,
      render: (val, _, idx) => (
        <div className="ratio-cell">
          <span className="ratio-period">第 {idx + 1} 期</span>
          <Tag color="app-blue" size="large">{val}%</Tag>
        </div>
      ),
    },
    {
      title: unit === 'wan' ? '含税金额 (万元)' : '含税金额 (元)',
      dataIndex: 'includingTaxAmount',
      width: 250,
      render: (val, record) => (
        <AmountWithCopy value={val} formatted={`¥${fmt(val)}`} chinese={record.chineseIncludingTax} bold color="var(--animal-primary-color)" />
      ),
    },
    {
      title: unit === 'wan' ? '不含税金额 (万元)' : '不含税金额 (元)',
      dataIndex: 'excludingTaxAmount',
      width: 250,
      render: (val, record) => (
        <AmountWithCopy value={val} formatted={`¥${fmt(val)}`} chinese={record.chineseExcludingTax} bold />
      ),
    },
  ];

  return (
    <div className="app-container" style={{ backgroundImage: `url(${bgImg})` }}>
      <div className="app-wrapper">
        {/* Header */}
        <header className="hero">
          <Title size="large" color="app-blue">合同金额与分期计算器</Title>
          <p className="hero-subtitle">输入合同参数，自动计算含税/不含税金额及各期款项</p>
        </header>

        {/* Input Card */}
        <Card className="input-card">
          {/* Contract params */}
          <div className="input-section-label">
            合同参数
            <Radio
              value={unit}
              onChange={setUnit}
              options={[
                { label: '元', value: 'yuan' },
                { label: '万元', value: 'wan' },
              ]}
              size="small"
              direction="horizontal"
              style={{ marginLeft: 12, display: 'inline-flex' }}
            />
          </div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">含税单价 ({unit === 'wan' ? '万元' : '元'})</label>
              <Input
                type="number"
                value={unitPrice ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setUnitPrice(v === '' ? null : parseFloat(v));
                }}
                placeholder="请输入单价"
                min="0"
                step={unit === 'wan' ? '0.0001' : '0.01'}
                prefix={<span className="input-prefix">¥</span>}
                size="large"
                style={{ width: '100%' }}
              />
            </div>
            <div className="input-group">
              <label className="input-label">数量</label>
              <Input
                type="number"
                value={quantity ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuantity(v === '' ? null : parseInt(v, 10));
                }}
                placeholder="请输入数量"
                min="0"
                step="1"
                size="large"
                style={{ width: '100%' }}
              />
            </div>
            <div className="input-group">
              <label className="input-label">税率</label>
              <Select
                value={taxRate}
                onChange={setTaxRate}
                options={TAX_RATE_OPTIONS}
              />
            </div>
          </div>

          {/* Installment plan */}
          <div className="input-section-label" style={{ marginTop: 24 }}>付款计划</div>
          <div className={`ratio-section ${hasAnyRatio ? (ratioValid ? 'valid' : 'invalid') : ''}`}>
            <label className="input-label" style={{ marginBottom: 12, display: 'block' }}>
              付款分期比例
              {hasAnyRatio && (
                ratioValid ? (
                  <span className="ratio-status"><span className="dot matched" />✓ 已匹配 100%</span>
                ) : (
                  <span className="ratio-status"><span className="dot mismatched" />合计 {ratioSum.toFixed(2)}%，需等于 100%</span>
                )
              )}
            </label>
            <div className="ratio-list">
              {ratioInputs.map((val, idx) => (
                <div key={idx} className="ratio-row">
                  <Input
                    type="number"
                    value={val}
                    onChange={(e) => updateRatio(idx, e.target.value)}
                    placeholder={`第 ${idx + 1} 期比例`}
                    min="0"
                    max="100"
                    step="0.01"
                    size="large"
                    suffix={<span className="input-suffix">%</span>}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    danger
                    size="small"
                    onClick={() => removeRatio(idx)}
                    disabled={ratioInputs.length <= 1}
                    className="remove-btn"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
            <div className="ratio-actions">
              <Button type="dashed" size="small" onClick={addRatio}>+ 添加付款期</Button>
              {PRESET_RATIOS.map((preset, idx) => (
                <Button key={idx} type="text" size="small" onClick={() => applyPreset(preset)} className="preset-btn">
                  {preset.join(' + ')}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Results */}
        {hasData ? (
          <div className="results-section fade-in">
            <Title size="middle" color="app-blue">计算结果</Title>

            {/* Summary Cards */}
            <div className="summary-grid">
              <Card className="summary-card highlight-card" color="app-blue">
                <div className="card-header">
                  <span className="card-title">含税总金额</span>
                </div>
                <div className="statistic-row">
                  <Typewriter trigger={dataKey} speed={40}>
                    <Wallet value={`¥${fmt(totals.amountIncludingTax)}`} size="medium" />
                  </Typewriter>
                  <CopyBtn text={fmt(totals.amountIncludingTax)} />
                </div>
                <ChineseBadge text={totals.chineseIncludingTax} />
              </Card>

              <Card className="summary-card tax-card" color="app-orange">
                <div className="card-header">
                  <span className="card-title">税额</span>
                </div>
                <div className="statistic-row">
                  <Typewriter trigger={dataKey} speed={40}>
                    <Wallet value={`¥${fmt(totals.taxAmount)}`} size="medium" />
                  </Typewriter>
                  <CopyBtn text={fmt(totals.taxAmount)} />
                </div>
                <ChineseBadge text={numberToChinese(totals.taxAmount)} />
              </Card>

              <Card className="summary-card exclude-card" color="app-green">
                <div className="card-header">
                  <span className="card-title">不含税金额</span>
                </div>
                <div className="statistic-row">
                  <Typewriter trigger={dataKey} speed={40}>
                    <Wallet value={`¥${fmt(totals.amountExcludingTax)}`} size="medium" />
                  </Typewriter>
                  <CopyBtn text={fmt(totals.amountExcludingTax)} />
                </div>
                <ChineseBadge text={totals.chineseExcludingTax} />
              </Card>
            </div>

            {/* Installment Table */}
            <Card className="installment-card">
              <Title size="small" color="app-blue">分期明细</Title>
              <Table
                columns={installmentColumns}
                dataSource={totals.installments}
                rowKey="key"
                loading={tableLoading}
                scroll={{ x: 640 }}
              />
              {/* Manual summary row */}
              <div className="table-summary">
                <span className="summary-label">合计</span>
                <AmountWithCopy
                  value={totals.amountIncludingTax}
                  formatted={`¥${fmt(totals.amountIncludingTax)}`}
                  chinese={totals.chineseIncludingTax}
                  bold
                  color="var(--animal-primary-color)"
                />
                <AmountWithCopy
                  value={totals.amountExcludingTax}
                  formatted={`¥${fmt(totals.amountExcludingTax)}`}
                  chinese={totals.chineseExcludingTax}
                  bold
                />
              </div>
            </Card>
          </div>
        ) : (
          <div className="empty-state">
            <Icon name="icon-miles" size={56} className="empty-icon" />
            <p className="empty-text">请在上方输入合同参数，计算结果将在此显示</p>
          </div>
        )}

        {/* Footer */}
        <div className="app-footer">
          <span className="footer-text">计算结果仅供参考，实际金额以合同约定为准</span>
        </div>
      </div>
    </div>
  );
}

export default App;
