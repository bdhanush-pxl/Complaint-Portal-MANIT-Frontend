import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import ComplaintCard from '../../../components/ComplaintCard/admin/ComplaintCard-admin';
import { 
    getComplaintsByDateRange_Admin, 
    updateComplaintStatusAdmin, 
    getComplaintStatistics_CategoryWise, 
    updateComplaintRemarksAdmin 
} from '../../../services/apiService';
import { Complaint, ReadStatus, ComplaintCategory,ComplaintFilters,MedicalComplaint} from '../../../types/complaint';
import ComplaintHeader from '../../../components/ComplaintHeader';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { VariableSizeList as List } from 'react-window';
import { calculateItemHeight } from '../../../components/Utility/heightCalculator';
import { toast } from 'react-toastify';

const MedicalComplaintList = () => {
    const navigate = useNavigate();
    const category: ComplaintCategory = 'Medical';


    const [filters, setFilters] = useState<ComplaintFilters>(() => ({
        startDate: '',
        endDate: new Date().toISOString().split('T')[0],
        complaintType: '',
        scholarNumbers: [],
        readStatus: '',
        status: '',
        hostelNumber: '',
        complaintIds: []
    }));

    const [complaints, setComplaints] = useState<MedicalComplaint[]>([]);
    const [lastSeenId, setLastSeenId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const listRef = useRef<List>(null);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const [statistics, setStatistics] = useState({
        totalComplaints: 0,
        resolvedComplaints: 0,
        unresolvedComplaints: 0,
        viewedComplaints: 0,
        notViewedComplaints: 0,
    });

    // Window resize handler
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            if (listRef.current) {
                listRef.current.resetAfterIndex(0);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const memoizedStatistics = useMemo(() => statistics, [statistics]);

    const handleAuthError = useCallback(() => {
        localStorage.removeItem('auth');
        navigate('/');
    }, [navigate]);

    const handleError = useCallback((err: any, fallbackMessage: string) => {
        if (err.response?.status === 401) {
            handleAuthError();
        } else {
            const message = err.response?.data?.message || err.message || fallbackMessage;
            toast.error(message);
        }
    }, [handleAuthError]);

    const fetchStatistics = useCallback(async () => {
        try {
            const stats = await getComplaintStatistics_CategoryWise(category);
            setStatistics(stats);
        } catch (err) {
            handleError(err, 'Failed to fetch medical statistics.');
        }
    }, [handleError]);

    const fetchComplaints = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const { complaints: newComplaints, nextLastSeenId } = await getComplaintsByDateRange_Admin(
                category,
                filters.startDate,
                filters.endDate,
                20,
                lastSeenId || '',
                filters
            );

            const medicalComplaints = newComplaints.filter(
                (complaint): complaint is MedicalComplaint => 
                complaint.category === 'Medical'
            );

            setComplaints(prev => 
                lastSeenId ? [...prev, ...medicalComplaints] : medicalComplaints
            );
            setLastSeenId(nextLastSeenId);
            setHasMore(!!nextLastSeenId);
        } catch (err) {
            handleError(err, 'Failed to fetch medical complaints.');
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [filters, lastSeenId, loading, hasMore, handleError]);

    useEffect(() => {
        fetchStatistics();
        fetchComplaints();
    }, [fetchStatistics, fetchComplaints]);

    const handleStatusUpdate = useCallback(async (complaintId: string, updates: Partial<Complaint>) => {
        try {
            await updateComplaintStatusAdmin(category, complaintId, updates.status || updates.readStatus || null);
            setComplaints(prev =>
                prev.map(c => 
                    c.id === complaintId 
                        ? { ...c, ...updates } as MedicalComplaint 
                        : c
                )
            );
        } catch (err) {
            handleError(err, 'Failed to update complaint status.');
        }
    }, [handleError]);

    const handleRemarksUpdate = useCallback(async (complaintId: string, AdminRemarks: any, AdminAttachments: any) => {
        try {
            await updateComplaintRemarksAdmin(category, complaintId, AdminRemarks, AdminAttachments);
            setComplaints(prev =>
                prev.map(c => 
                    c.id === complaintId 
                        ? { ...c, AdminRemarks, AdminAttachments } as MedicalComplaint 
                        : c
                )
            );
        } catch (err) {
            handleError(err, 'Failed to update remarks.');
        }
    }, [handleError]);

    const handleFilterUpdate = useCallback((newFilters: Partial<ComplaintFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const handleApplyFilters = useCallback(async () => {
        setComplaints([]);
        setLastSeenId(null);
        setHasMore(true);
        fetchComplaints();
    }, [fetchComplaints]);

    const getItemSize = useCallback((index: number) => {
        const complaint = complaints[index];
        if (!complaint) return 0;

        const hasAttachments = Boolean(
            (complaint.attachments && complaint.attachments.length > 0) ||
            (complaint.AdminAttachments && complaint.AdminAttachments.length > 0)
        );

        return calculateItemHeight(
            expandedItems.has(complaint.id),
            windowWidth,
            hasAttachments
        );
    }, [expandedItems, complaints, windowWidth]);

    if (loading && complaints.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <ComplaintHeader
                    category={category}
                    loading={loading}
                    isFilterOpen={isFilterOpen}
                    statistics={memoizedStatistics}
                    onFilterClick={() => setIsFilterOpen(prev => !prev)}
                    filters={filters}
                    onFilterUpdate={handleFilterUpdate}
                    onApplyFilters={handleApplyFilters}
                    setStatistics={setStatistics}
                    onBackClick={() => navigate(-1)}
                />

                {complaints.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                        <div className="max-w-md mx-auto">
                            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 text-lg">No medical complaints found.</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-[calc(100vh-200px)]">
                        <List
                            ref={listRef}
                            height={window.innerHeight - 200}
                            itemCount={hasMore ? complaints.length + 1 : complaints.length}
                            itemSize={getItemSize}
                            width="100%"
                            overscanCount={5}
                        >
                            {({ index, style }) => {
                                if (index >= complaints.length) {
                                    return loading ? (
                                        <div style={style} className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </div>
                                    ) : null;
                                }

                                const complaint = complaints[index];
                                return (
                                    <div
                                        style={{
                                            ...style,
                                            paddingTop: '16px',
                                            paddingBottom: '32px',
                                            height: 'auto',
                                            maxHeight: style.height as number - 48,
                                            transition: 'all 0.3s ease'
                                        }}
                                        key={complaint.id}
                                    >
                                        <ComplaintCard
                                            complaint={complaint}
                                            onUpdate={handleStatusUpdate}
                                            onRemarksUpdate={handleRemarksUpdate}
                                        />
                                    </div>
                                );
                            }}
                        </List>
                    </div>
                )}
            </div>
        </div>
    );
};

const MemoizedMedicalComplaintList = React.memo(MedicalComplaintList);

export default React.memo(() => (
    <ErrorBoundary>
        <MemoizedMedicalComplaintList />
    </ErrorBoundary>
));
