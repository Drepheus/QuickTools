import { useState } from 'react';
import {
    FileText,
    Plus,
    Download,
    Trash2,
    Building2,
    User,
    Calendar,
    DollarSign,
    Loader2,
    Check
} from 'lucide-react';

interface PaystubData {
    employerName: string;
    employerAddress: string;
    employeeName: string;
    employeeAddress: string;
    employeeId: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    payDate: string;
    hourlyRate: number;
    hoursWorked: number;
    overtimeHours: number;
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    healthInsurance: number;
    retirement401k: number;
}

const defaultData: PaystubData = {
    employerName: 'Acme Corporation',
    employerAddress: '123 Business Ave, Suite 100, New York, NY 10001',
    employeeName: 'John Doe',
    employeeAddress: '456 Employee St, Apt 2B, New York, NY 10002',
    employeeId: 'EMP-001234',
    payPeriodStart: '2024-01-01',
    payPeriodEnd: '2024-01-15',
    payDate: '2024-01-20',
    hourlyRate: 25,
    hoursWorked: 80,
    overtimeHours: 5,
    federalTax: 12,
    stateTax: 5,
    socialSecurity: 6.2,
    medicare: 1.45,
    healthInsurance: 150,
    retirement401k: 5,
};

export function PaystubGeneratorPage() {
    const [data, setData] = useState<PaystubData>(defaultData);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const regularPay = data.hourlyRate * data.hoursWorked;
    const overtimePay = data.hourlyRate * 1.5 * data.overtimeHours;
    const grossPay = regularPay + overtimePay;

    const federalTaxAmount = grossPay * (data.federalTax / 100);
    const stateTaxAmount = grossPay * (data.stateTax / 100);
    const socialSecurityAmount = grossPay * (data.socialSecurity / 100);
    const medicareAmount = grossPay * (data.medicare / 100);
    const retirement401kAmount = grossPay * (data.retirement401k / 100);

    const totalDeductions = federalTaxAmount + stateTaxAmount + socialSecurityAmount + medicareAmount + data.healthInsurance + retirement401kAmount;
    const netPay = grossPay - totalDeductions;

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setShowPreview(true);
        }, 1500);
    };

    const handleDownload = () => {
        // Mock download - in real version would generate PDF
        alert('PDF Download - This is a mock feature. Full functionality coming soon!');
    };

    const updateField = (field: keyof PaystubData, value: string | number) => {
        setData(prev => ({ ...prev, [field]: value }));
        setShowPreview(false);
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col py-4 px-6">
            <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl glow-border flex items-center justify-center">
                            <FileText size={20} className="text-[var(--color-glow)]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Paystub Generator</h1>
                            <p className="text-xs text-[var(--color-text-muted)]">Create professional pay stubs instantly</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setData(defaultData)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-dark-500)]"
                        >
                            <Trash2 size={14} /> Reset
                        </button>
                        {showPreview && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-active-green)] text-black shadow-[0_0_15px_var(--color-active-green-glow)]"
                            >
                                <Download size={14} /> Download PDF
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
                    {/* Left: Form */}
                    <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                        {/* Employer Info */}
                        <div className="p-4 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Building2 size={16} className="text-[var(--color-glow)]" />
                                <h3 className="text-sm font-semibold text-white">Employer Information</h3>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={data.employerName}
                                    onChange={(e) => updateField('employerName', e.target.value)}
                                    placeholder="Company Name"
                                    className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                />
                                <input
                                    type="text"
                                    value={data.employerAddress}
                                    onChange={(e) => updateField('employerAddress', e.target.value)}
                                    placeholder="Company Address"
                                    className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                />
                            </div>
                        </div>

                        {/* Employee Info */}
                        <div className="p-4 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                            <div className="flex items-center gap-2 mb-3">
                                <User size={16} className="text-[var(--color-glow)]" />
                                <h3 className="text-sm font-semibold text-white">Employee Information</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={data.employeeName}
                                    onChange={(e) => updateField('employeeName', e.target.value)}
                                    placeholder="Employee Name"
                                    className="col-span-2 px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                />
                                <input
                                    type="text"
                                    value={data.employeeAddress}
                                    onChange={(e) => updateField('employeeAddress', e.target.value)}
                                    placeholder="Employee Address"
                                    className="col-span-2 px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                />
                                <input
                                    type="text"
                                    value={data.employeeId}
                                    onChange={(e) => updateField('employeeId', e.target.value)}
                                    placeholder="Employee ID"
                                    className="px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                />
                            </div>
                        </div>

                        {/* Pay Period */}
                        <div className="p-4 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar size={16} className="text-[var(--color-glow)]" />
                                <h3 className="text-sm font-semibold text-white">Pay Period</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Start Date</label>
                                    <input
                                        type="date"
                                        value={data.payPeriodStart}
                                        onChange={(e) => updateField('payPeriodStart', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">End Date</label>
                                    <input
                                        type="date"
                                        value={data.payPeriodEnd}
                                        onChange={(e) => updateField('payPeriodEnd', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Pay Date</label>
                                    <input
                                        type="date"
                                        value={data.payDate}
                                        onChange={(e) => updateField('payDate', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Earnings */}
                        <div className="p-4 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                            <div className="flex items-center gap-2 mb-3">
                                <DollarSign size={16} className="text-[var(--color-active-green)]" />
                                <h3 className="text-sm font-semibold text-white">Earnings</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Hourly Rate ($)</label>
                                    <input
                                        type="number"
                                        value={data.hourlyRate}
                                        onChange={(e) => updateField('hourlyRate', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Hours Worked</label>
                                    <input
                                        type="number"
                                        value={data.hoursWorked}
                                        onChange={(e) => updateField('hoursWorked', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Overtime Hours</label>
                                    <input
                                        type="number"
                                        value={data.overtimeHours}
                                        onChange={(e) => updateField('overtimeHours', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-3 rounded-xl text-sm font-medium glow-button text-white disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <><Loader2 size={16} className="animate-spin" /> Generating...</>
                            ) : showPreview ? (
                                <><Check size={16} /> Regenerate Paystub</>
                            ) : (
                                <><Plus size={16} /> Generate Paystub</>
                            )}
                        </button>
                    </div>

                    {/* Right: Preview */}
                    <div className="flex flex-col min-h-0">
                        <div className="flex-1 rounded-xl border border-[var(--color-dark-500)] bg-white overflow-hidden">
                            {showPreview ? (
                                <div className="h-full overflow-y-auto p-6 text-black text-sm">
                                    {/* Paystub Preview */}
                                    <div className="border-b-2 border-black pb-4 mb-4">
                                        <h2 className="text-xl font-bold">{data.employerName}</h2>
                                        <p className="text-gray-600 text-xs">{data.employerAddress}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="font-semibold">{data.employeeName}</p>
                                            <p className="text-gray-600 text-xs">{data.employeeAddress}</p>
                                            <p className="text-gray-600 text-xs">ID: {data.employeeId}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-600">Pay Period: {data.payPeriodStart} to {data.payPeriodEnd}</p>
                                            <p className="text-xs text-gray-600">Pay Date: {data.payDate}</p>
                                        </div>
                                    </div>

                                    <div className="border rounded mb-4">
                                        <div className="bg-gray-100 px-3 py-2 font-semibold border-b">Earnings</div>
                                        <div className="px-3 py-2 space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span>Regular Pay ({data.hoursWorked} hrs × ${data.hourlyRate})</span>
                                                <span>${regularPay.toFixed(2)}</span>
                                            </div>
                                            {data.overtimeHours > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Overtime Pay ({data.overtimeHours} hrs × ${(data.hourlyRate * 1.5).toFixed(2)})</span>
                                                    <span>${overtimePay.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-semibold border-t pt-1">
                                                <span>Gross Pay</span>
                                                <span>${grossPay.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border rounded mb-4">
                                        <div className="bg-gray-100 px-3 py-2 font-semibold border-b">Deductions</div>
                                        <div className="px-3 py-2 space-y-1 text-xs">
                                            <div className="flex justify-between"><span>Federal Tax ({data.federalTax}%)</span><span>-${federalTaxAmount.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>State Tax ({data.stateTax}%)</span><span>-${stateTaxAmount.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>Social Security ({data.socialSecurity}%)</span><span>-${socialSecurityAmount.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>Medicare ({data.medicare}%)</span><span>-${medicareAmount.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>Health Insurance</span><span>-${data.healthInsurance.toFixed(2)}</span></div>
                                            <div className="flex justify-between"><span>401(k) ({data.retirement401k}%)</span><span>-${retirement401kAmount.toFixed(2)}</span></div>
                                            <div className="flex justify-between font-semibold border-t pt-1">
                                                <span>Total Deductions</span>
                                                <span>-${totalDeductions.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-green-100 border border-green-300 rounded p-3 text-center">
                                        <p className="text-xs text-gray-600">Net Pay</p>
                                        <p className="text-2xl font-bold text-green-700">${netPay.toFixed(2)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <FileText size={48} className="mb-3 opacity-30" />
                                    <p className="text-sm">Fill in the details and click Generate</p>
                                    <p className="text-xs mt-1">Preview will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
