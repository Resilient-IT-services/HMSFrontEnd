'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { labApi } from '@/modules/lab/api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatDateTime, formatRxNumber } from '@/utils/formatters';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import LabResultEntryModal from '../components/LabResultEntryModal';

const categoryConfig: Record<string, { label: string, variant: any }> = {
  LAB: { label: 'Lab', variant: 'orange' },
  RADIOLOGY: { label: 'Radiology', variant: 'blue' },
  CARDIOLOGY: { label: 'Cardiology', variant: 'emerald' }
};

const statusMapping: Record<string, { label: string, variant: any }> = {
  PENDING: { label: 'Pending', variant: 'slate' },
  SAMPLE_COLLECTED: { label: 'Sample Collected', variant: 'blue' },
  PROCESSING: { label: 'In Processing', variant: 'indigo' },
  RESULT_ENTERED: { label: 'Result Entered', variant: 'orange' },
  VERIFIED: { label: 'Verified', variant: 'emerald' },
  RECOMMENDED: { label: 'Recommended', variant: 'slate' }
};

const LabQueuePage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const hospitalName = user?.memberships?.find(m => m.hospitalId === user.currentHospitalId)?.hospitalName;

  const [activeTab, setActiveTab] = useState<'RECOMMENDED' | 'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULT_ENTERED' | 'VERIFIED'>('RECOMMENDED');
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [selectedRecommendation, setSelectedRecommendation] = useState<any | null>(null);
  const [selectedOrderTest, setSelectedOrderTest] = useState<any | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyData, setVerifyData] = useState<any | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'RECOMMENDED') {
        const res = await labApi.getRecommendations(0, 100);
        if (res.success && res.data) {
          setQueue(res.data.content);
        }
      } else {
        const res = await labApi.getPagedQueue(activeTab === 'VERIFIED' ? 'VERIFIED' : activeTab, 0, 100);
        if (res.success && res.data) {
          setQueue(res.data.content);
        }
      }
    } catch (error) {
      console.error('Failed to fetch lab queue:', error);
      triggerGlobalToast('Failed to load queue', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
        const init = async () => {
            await fetchQueue();
        };
        void init();
    }, [activeTab, fetchQueue]); // Fetch when activeTab changes

  const handleCollectSample = async (orderTestId: string) => {
    try {
      setLoading(true);
      const res = await labApi.collectSample(orderTestId);
      if (res.success) {
        triggerGlobalToast(`Sample Collected: ${res.data}`, 'success');
        void fetchQueue();
      }
    } catch (error: any) {
      console.error('Failed to collect sample:', error);
      triggerGlobalToast(error.response?.data?.message || 'Failed to collect sample', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkProcessing = async (orderTestId: string) => {
    try {
      setLoading(true);
      const res = await labApi.markProcessing(orderTestId);
      if (res.success) {
        triggerGlobalToast('Test marked as Processing', 'success');
        void fetchQueue();
      }
    } catch (error: any) {
      console.error('Failed to mark processing:', error);
      triggerGlobalToast(error.response?.data?.message || 'Failed to mark processing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterResult = (orderTest: any) => {
    setSelectedOrderTest(orderTest);
    setIsResultModalOpen(true);
  };

  const handleOpenBilling = (recommendation: any) => {
    setSelectedRecommendation(recommendation);
    setIsBillingModalOpen(true);
  };

  const handleVerify = (item: any, status: 'VERIFIED' | 'REJECTED') => {
    setVerifyData({ ...item, verificationStatus: status });
    setIsVerifyModalOpen(true);
  };

  const handleConfirmVerify = async (remarks: string) => {
    if (!verifyData) return;

    try {
        setLoading(true);
        const res = await labApi.verifyResult(verifyData.orderTestId, remarks, verifyData.verificationStatus);
        if (res.success) {
            triggerGlobalToast(`Result ${verifyData.verificationStatus.toLowerCase()} successfully`, 'success');
            setIsVerifyModalOpen(false);
            setVerifyData(null);
            void fetchQueue();
        }
    } catch (error) {
        console.error('Failed to verify:', error);
        triggerGlobalToast('Failed to verify result', 'error');
    } finally {
        setLoading(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: activeTab === 'RECOMMENDED' ? 'Prescription' : 'Order Info',
      render: (item) => (
        <div>
          <p className="text-sm font-bold text-slate-800">
            {activeTab === 'RECOMMENDED' ? formatRxNumber(item.prescriptionNumber, item.id, item.createdAt, hospitalName) : item.orderNumber}
          </p>
          <p className="text-[10px] text-slate-400 font-bold">{formatDateTime(activeTab === 'RECOMMENDED' ? item.createdAt : item.orderedAt)}</p>
        </div>
      )
    },
    {
      header: 'Patient Details',
      render: (item) => (
        <div>
          <p className="text-sm font-bold text-slate-800">{item.patientName}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {activeTab === 'RECOMMENDED' ? item.patientCode || 'N/A' : item.patientId}
          </p>
        </div>
      )
    },
    {
      header: activeTab === 'RECOMMENDED' ? 'Items' : 'Test & Category',
      render: (item) => (
          <div>
            <p className="text-sm font-bold text-slate-700">
              {activeTab === 'RECOMMENDED' ? `${item.itemCount} Tests Recommended` : item.testName}
            </p>
            {!activeTab.includes('RECOMMENDED') && item.category && (
              <Badge variant={categoryConfig[item.category]?.variant || 'slate'} size="sm" className="mt-1">
                {categoryConfig[item.category]?.label || item.category}
              </Badge>
            )}
          </div>
      )
    },
    {
      header: 'Referred By',
      render: (item) => <span className="text-xs font-bold text-slate-600">{item.doctorName || 'Self'}</span>
    },
    {
      header: 'Status',
      render: (item) => {
        const status = activeTab === 'RECOMMENDED' ? 'RECOMMENDED' : item.status;
        const config = statusMapping[status] || { label: status, variant: 'slate' };
        
        return (
          <Badge 
            variant={config.variant} 
            size="sm"
          >
            {config.label}
          </Badge>
        );
      }
    },
    {
      header: 'Action',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (item) => {
        if (activeTab === 'RECOMMENDED') {
            return (
                <Button size="sm" icon="payments" className="bg-orange-700 hover:bg-orange-800" onClick={() => handleOpenBilling(item)}>
                    Generate Bill
                </Button>
            );
        }
        
        if (item.status === 'PENDING') {
          return (
            <div className="flex justify-center gap-2">
              {item.category === 'LAB' ? (
                <Button size="sm" onClick={() => handleCollectSample(item.orderTestId)}>
                  Collect Sample
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => handleEnterResult(item)}>
                  Enter Findings
                </Button>
              )}
            </div>
          );
        }
        
        if (item.status === 'SAMPLE_COLLECTED') {
          return (
            <Button size="sm" onClick={() => handleMarkProcessing(item.orderTestId)}>
              Mark Processing
            </Button>
          );
        }

        if (item.status === 'PROCESSING') {
          return (
            <Button size="sm" variant="secondary" onClick={() => handleEnterResult(item)}>
              Enter Result
            </Button>
          );
        }
        
        if (item.status === 'RESULT_ENTERED') {
          return (
            <div className="flex justify-center gap-2">
                <Button size="sm" className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white" onClick={() => handleVerify(item.orderTestId, 'VERIFIED')}>
                    Verify
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleEnterResult(item)}>
                    Edit Result
                </Button>
            </div>
          );
        }
        
        if (item.status === 'VERIFIED') {
            return (
              <Badge variant="emerald">Verified</Badge>
            );
        }
        return null;
      }
    }
  ];

  return (
    <MainLayout title="Laboratory Work Queue">
      <PageSurface>
        <div className="space-y-4 py-4">
          <PageHeading
            title="Laboratory Queue"
            description="Manage sample collections, process results, and verify reports."
          />

          <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
            <button
                onClick={() => setActiveTab('RECOMMENDED')}
                className={`px-6 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === 'RECOMMENDED' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              Recommended
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-6 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'PENDING' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('SAMPLE_COLLECTED')}
              className={`px-6 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'SAMPLE_COLLECTED' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Collected
            </button>
            <button
              onClick={() => setActiveTab('PROCESSING')}
              className={`px-6 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'PROCESSING' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => setActiveTab('RESULT_ENTERED')}
              className={`px-6 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'RESULT_ENTERED' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Pending Verification
            </button>
            <button
              onClick={() => setActiveTab('VERIFIED')}
              className={`px-6 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'VERIFIED' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Verified
            </button>
          </div>

          <ContentPanel>
            <Table
              columns={columns}
              data={queue}
              isLoading={loading}
              emptyMessage={`No ${activeTab.replace('_', ' ').toLowerCase()} orders found.`}
            />
          </ContentPanel>
        </div>

        {isResultModalOpen && selectedOrderTest && (
            <LabResultEntryModal 
              isOpen={true}
              onClose={() => {
                setIsResultModalOpen(false);
                setSelectedOrderTest(null);
                fetchQueue();
              }}
              orderTestId={selectedOrderTest.orderTestId}
              testName={selectedOrderTest.testName}
              resultEntryType={selectedOrderTest.resultEntryType}
            />
        )}

        {isBillingModalOpen && selectedRecommendation && (
            <LabBillingModal
                isOpen={true}
                onClose={() => {
                    setIsBillingModalOpen(false);
                    setSelectedRecommendation(null);
                    fetchQueue();
                }}
                recommendationId={selectedRecommendation.id}
            />
        )}

        {isVerifyModalOpen && verifyData && (
            <LabVerificationModal
                isOpen={true}
                onClose={() => {
                    setIsVerifyModalOpen(false);
                    setVerifyData(null);
                }}
                item={verifyData}
                onConfirm={handleConfirmVerify}
            />
        )}
      </PageSurface>
    </MainLayout>
  );
};

// --- Lab Verification Modal ---
const LabVerificationModal = ({ isOpen, onClose, item, onConfirm }: { isOpen: boolean, onClose: () => void, item: any, onConfirm: (remarks: string) => void }) => {
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);
    const [parameters, setParameters] = useState<any[]>([]);
    const [findings, setFindings] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                if (item.resultEntryType?.toUpperCase() === 'PARAMETER') {
                    const res = await labApi.getParametersByOrderTest(item.orderTestId);
                    if (res.success) setParameters(res.data || []);
                } else {
                    // For narrative, we might need an API to get narrative results.
                    // Assuming for now findings might be in item or fetched differently.
                    // If your API doesn't provide narrative result here, we can add it.
                    setFindings(item.findings || 'Findings already recorded.');
                }
            } catch (error) {
                console.error('Failed to fetch results for verification:', error);
            } finally {
                setLoading(false);
            }
        };
        if (isOpen && item) void fetchResults();
    }, [isOpen, item]);

    const status = item.verificationStatus;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${status === 'VERIFIED' ? 'Verify' : 'Reject'} Result: ${item.testName}`} size="lg">
            <div className="p-6 space-y-6">
                {/* Result Display Section */}
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Entered Results</h4>
                    
                    {loading ? (
                        <div className="py-4 text-center italic text-slate-400 text-xs">Loading data...</div>
                    ) : item.resultEntryType?.toUpperCase() === 'PARAMETER' ? (
                        <div className="space-y-3">
                            {parameters.length > 0 ? parameters.map((param, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                    <span className="font-bold text-slate-600">{param.parameterName}</span>
                                    <div className="text-right">
                                        <span className={`font-black ${param.abnormal ? 'text-red-600' : 'text-slate-900'}`}>
                                            {param.resultValue} {param.unit}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 italic">No parameter data found.</p>
                            )}
                        </div>
                    ) : (
                        <div className="p-2">
                             <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{findings || item.findings || 'Findings recorded.'}</p>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
                        Verification Remarks
                    </label>
                    <textarea
                        className="w-full h-32 bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-primary transition-all resize-none shadow-inner"
                        placeholder={status === 'VERIFIED' ? "Enter 'OK' or specific notes for the doctor..." : "Reason for rejection..."}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                    />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button 
                        variant={status === 'VERIFIED' ? 'primary' : 'danger'} 
                        onClick={() => onConfirm(remarks || (status === 'VERIFIED' ? 'OK' : 'Rejected'))}
                    >
                        Confirm {status === 'VERIFIED' ? 'Verification' : 'Rejection'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// --- Lab Billing Modal ---
import { Modal } from '@/components/ui/Modal';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';

const LabBillingModal = ({ isOpen, onClose, recommendationId }: { isOpen: boolean, onClose: () => void, recommendationId: string }) => {
    const [prescription, setPrescription] = useState<any>(null);
    const [allTests, setAllTests] = useState<any[]>([]);
    const [allPrices, setAllPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTests, setSelectedTests] = useState<string[]>([]);
    const [extraTests, setExtraTests] = useState<any[]>([]);
    const [testSearch, setTestSearch] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
    const [amountPaid, setAmountPaid] = useState<string>('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [presRes, testsRes, pricesRes] = await Promise.all([
                    pharmacyApi.getPrescriptionById(recommendationId),
                    labApi.getTests(),
                    labApi.getAllPricing()
                ]);

                if (presRes.success && presRes.data) {
                    setPrescription(presRes.data);
                    const pendingTests = presRes.data.labItems?.filter((item: any) => item.status === 'PENDING' || !item.status)
                        .map((item: any) => item.testId) || [];
                    setSelectedTests(pendingTests);
                }

                if (testsRes.success && testsRes.data) setAllTests(testsRes.data);
                if (pricesRes.success && pricesRes.data) setAllPrices(pricesRes.data);
            } catch (error) {
                console.error(error);
                triggerGlobalToast('Failed to load billing data', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [recommendationId]);

    const getPrice = (testId: string) => {
        return allPrices.find(p => p.testId === testId)?.standardPrice || 0;
    };

    const totalAmount = selectedTests.reduce((sum, id) => sum + getPrice(id), 0);

    const filteredTests = allTests.filter(t => 
        t.testName.toLowerCase().includes(testSearch.toLowerCase()) && 
        !selectedTests.includes(t.id)
    ).slice(0, 5);

    const handleAddExtraTest = (test: any) => {
        setSelectedTests([...selectedTests, test.id]);
        setExtraTests([...extraTests, test]);
        setTestSearch('');
        setShowSearchResults(false);
    };

    const handleConfirmOrder = async () => {
        if (selectedTests.length === 0) {
            triggerGlobalToast('Please select at least one test', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const res = await labApi.createOrderFromRecommendation({
                prescriptionId: recommendationId,
                testIds: selectedTests,
                paymentMode,
                amountPaid: Number.parseFloat(amountPaid) || 0,
                referenceNumber: referenceNumber || undefined
            });

            if (res.success) {
                triggerGlobalToast('Order created and payment recorded', 'success');
                onClose();
            } else {
                triggerGlobalToast(res.message || 'Failed to create order', 'error');
            }
        } catch (error: any) {
            triggerGlobalToast(error.response?.data?.message || 'Error creating order', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Lab Billing & Order">
            <div className="p-8 text-center">
                <p className="text-sm text-slate-500 animate-pulse">Loading prescription and pricing...</p>
            </div>
        </Modal>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Lab Billing & Order" size="2xl">
            <div className="flex flex-col md:flex-row gap-0 md:divide-x divide-slate-100">
                {/* Left Side: Test Selection */}
                <div className="flex-[1.2] p-5 space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tests to Bill</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                {selectedTests.length} Selected
                            </span>
                        </div>
                        
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {/* Recommended Tests */}
                            {prescription?.labItems?.filter((item: any) => item.status === 'PENDING' || !item.status).map((test: any) => (
                                <div key={test.testId} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedTests.includes(test.testId) ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-slate-100'}`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedTests.includes(test.testId)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedTests([...selectedTests, test.testId]);
                                            else setSelectedTests(selectedTests.filter(id => id !== test.testId));
                                        }}
                                        className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-slate-800 truncate">{test.testName}</p>
                                            <span className="text-xs font-black text-slate-700 ml-2">₹{getPrice(test.testId)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="slate" size="sm" className="opacity-70">Recommended</Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Extra Added Tests */}
                            {extraTests.map((test: any) => (
                                <div key={test.id} className="flex items-center gap-3 p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl">
                                    <button 
                                        onClick={() => {
                                            setSelectedTests(selectedTests.filter(id => id !== test.id));
                                            setExtraTests(extraTests.filter(t => t.id !== test.id));
                                        }}
                                        className="text-emerald-500 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">remove_circle</span>
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-slate-800 truncate">{test.testName}</p>
                                            <span className="text-xs font-black text-slate-700 ml-2">₹{getPrice(test.id)}</span>
                                        </div>
                                        <Badge variant="emerald" size="sm" className="opacity-70">Extra Add-on</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add More Tests Search */}
                    <div className="relative">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Add Additional Tests</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">search</span>
                            <input
                                type="text"
                                value={testSearch}
                                onChange={(e) => {
                                    setTestSearch(e.target.value);
                                    setShowSearchResults(true);
                                }}
                                onFocus={() => setShowSearchResults(true)}
                                placeholder="Search by test name..."
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all"
                            />
                        </div>

                        {showSearchResults && testSearch && (
                            <div className="absolute z-10 bottom-full mb-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                {filteredTests.length > 0 ? (
                                    filteredTests.map(test => (
                                        <button
                                            key={test.id}
                                            onClick={() => handleAddExtraTest(test)}
                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{test.testName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{test.testCode}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-slate-800">₹{getPrice(test.id)}</p>
                                                <span className="text-[10px] font-bold text-emerald-600">+ Add</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-500 font-bold">No tests found</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Payment & Summary */}
                <div className="flex-1 p-5 bg-slate-50/50 space-y-6">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4">Bill Summary</h3>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                <span>Subtotal</span>
                                <span>₹{totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                <span>Discount</span>
                                <span className="text-emerald-600">- ₹0.00</span>
                            </div>
                            <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
                                <span className="text-sm font-black text-slate-800">Total Payable</span>
                                <span className="text-lg font-black text-primary">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Payment Mode</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['CASH', 'UPI', 'CARD'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setPaymentMode(mode)}
                                        className={`py-2 text-[10px] font-black rounded-lg border transition-all ${
                                            paymentMode === mode 
                                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Amount Paid (₹)</label>
                                <button 
                                    onClick={() => setAmountPaid(totalAmount.toString())}
                                    className="text-[9px] font-black text-primary hover:underline uppercase"
                                >
                                    Pay Full Amount
                                </button>
                            </div>
                            <input
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-black text-slate-800 outline-none focus:border-primary transition-all"
                            />
                        </div>

                        {paymentMode !== 'CASH' && (
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Reference Number</label>
                                <input
                                    type="text"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    placeholder="TXN ID / UPI Ref"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-primary transition-all"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex flex-col gap-2">
                        <Button 
                            className="w-full bg-slate-900 hover:bg-black h-12 text-sm font-black uppercase tracking-widest" 
                            onClick={handleConfirmOrder}
                            isLoading={submitting}
                        >
                            Complete Billing & Order
                        </Button>
                        <button 
                            onClick={onClose}
                            className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest py-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default LabQueuePage;
