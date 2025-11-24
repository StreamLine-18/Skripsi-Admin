import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { whistleblowingApi, type Whistleblowing } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    Shield,
    TrendingUp,
    ArrowDown,
    ArrowUp,
    Minus,
    ChevronsUp,
    ChevronsDown,
    FileText,
    Download
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function WBS() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedReport, setSelectedReport] = useState<Whistleblowing | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [internalNotes, setInternalNotes] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const { data: reportsResponse, isLoading } = useQuery({
        queryKey: ["whistleblowing", page, statusFilter, priorityFilter],
        queryFn: () => {
            const params: any = { page, pageSize: 10 };
            if (statusFilter !== "all") params.status = statusFilter;
            if (priorityFilter !== "all") params.priority = priorityFilter;
            return whistleblowingApi.getReports(params);
        },
    });

    const { data: analyticsResponse } = useQuery({
        queryKey: ["whistleblowing-analytics"],
        queryFn: whistleblowingApi.getAnalytics,
    });

    const reports = reportsResponse?.data || [];
    const pagination = reportsResponse?.pagination;
    const analytics = analyticsResponse?.data;

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, internal_notes }: { id: string; status: string; internal_notes: string }) =>
            whistleblowingApi.updateStatus(id, { status, internal_notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["whistleblowing"] });
            queryClient.invalidateQueries({ queryKey: ["whistleblowing-analytics"] });
            setSelectedReport(null);
            setInternalNotes("");
            setNewStatus("");
            toast({
                title: "Berhasil",
                description: "Status laporan berhasil diupdate",
            });
        },
        onError: () => {
            toast({
                title: "Gagal",
                description: "Gagal mengupdate status laporan",
                variant: "destructive",
            });
        },
    });

    const handleUpdateStatus = () => {
        if (!selectedReport || !newStatus || !internalNotes) {
            toast({
                title: "Peringatan",
                description: "Mohon lengkapi status dan catatan internal",
                variant: "destructive",
            });
            return;
        }

        updateStatusMutation.mutate({
            id: selectedReport.id_wbs,
            status: newStatus,
            internal_notes: internalNotes,
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { className: string; icon: any; label: string }> = {
            Baru: {
                className: "bg-yellow-100 text-yellow-800 border-yellow-200",
                icon: Clock,
                label: "Baru"
            },
            Diproses: {
                className: "bg-blue-100 text-blue-800 border-blue-200",
                icon: AlertCircle,
                label: "Diproses"
            },
            Selesai: {
                className: "bg-green-100 text-green-800 border-green-200",
                icon: CheckCircle,
                label: "Selesai"
            },
            Ditolak: {
                className: "bg-red-100 text-red-800 border-red-200",
                icon: XCircle,
                label: "Ditolak"
            },
        };

        const config = variants[status] || variants.Baru;
        const Icon = config.icon;

        return (
            <Badge className={`gap-1 ${config.className}`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const config: Record<string, { className: string; icon: any; label: string }> = {
            SangatRendah: {
                className: "bg-gray-100 text-gray-800 border-gray-200",
                icon: ChevronsDown,
                label: "Sangat Rendah",
            },
            Rendah: {
                className: "bg-blue-100 text-blue-800 border-blue-200",
                icon: ArrowDown,
                label: "Rendah",
            },
            Sedang: {
                className: "bg-yellow-100 text-yellow-800 border-yellow-200",
                icon: Minus,
                label: "Sedang",
            },
            Tinggi: {
                className: "bg-orange-100 text-orange-800 border-orange-200",
                icon: ArrowUp,
                label: "Tinggi",
            },
            SangatTinggi: {
                className: "bg-red-100 text-red-800 border-red-200",
                icon: ChevronsUp,
                label: "Sangat Tinggi",
            },
        };

        const priorityConfig = config[priority] || config.Sedang;
        const Icon = priorityConfig.icon;

        return (
            <Badge className={`gap-1 ${priorityConfig.className}`}>
                <Icon className="h-3 w-3" />
                {priorityConfig.label}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Whistleblowing System (WBS)
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Kelola laporan whistleblowing anonim dengan kerahasiaan terjamin
                </p>
            </div>

            {/* Stats Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Laporan</p>
                                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                                        {analytics.total_reports}
                                    </p>
                                </div>
                                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Shield className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Baru</p>
                                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                                        {analytics.by_status.Baru || 0}
                                    </p>
                                </div>
                                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Diproses</p>
                                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                                        {analytics.by_status.Diproses || 0}
                                    </p>
                                </div>
                                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Selesai</p>
                                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                                        {analytics.by_status.Selesai || 0}
                                    </p>
                                </div>
                                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between mt-2 mb-8">
                        <CardTitle>Daftar Laporan WBS</CardTitle>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="Baru">Baru</SelectItem>
                                <SelectItem value="Diproses">Diproses</SelectItem>
                                <SelectItem value="Selesai">Selesai</SelectItem>
                                <SelectItem value="Ditolak">Ditolak</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter Prioritas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Prioritas</SelectItem>
                                <SelectItem value="SangatRendah">Sangat Rendah</SelectItem>
                                <SelectItem value="Rendah">Rendah</SelectItem>
                                <SelectItem value="Sedang">Sedang</SelectItem>
                                <SelectItem value="Tinggi">Tinggi</SelectItem>
                                <SelectItem value="SangatTinggi">Sangat Tinggi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Tidak ada data laporan</div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Prioritas</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>File</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.map((report) => (
                                        <TableRow key={report.id_wbs}>
                                            <TableCell className="font-medium">
                                                {formatDate(report.created_on)}
                                            </TableCell>
                                            <TableCell>{getPriorityBadge(report.priority)}</TableCell>
                                            <TableCell>{getStatusBadge(report.status)}</TableCell>
                                            <TableCell>
                                                {report.files && report.files.length > 0 ? (
                                                    <Badge variant="outline" className="gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        {report.files.length} file
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                {report.internal_notes ? (
                                                    <span className="truncate block" title={report.internal_notes}>
                                                        {report.internal_notes}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedReport(report);
                                                        setNewStatus(report.status);
                                                        setInternalNotes(report.internal_notes || "");
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {pagination && pagination.total_pages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                    <div className="text-sm text-gray-600">
                                        Menampilkan <span className="font-medium">{((pagination.page - 1) * pagination.page_size) + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.page_size, pagination.total_records)}</span> dari <span className="font-medium">{pagination.total_records}</span> laporan
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                        >
                                            Sebelumnya
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                                                let pageNum;
                                                if (pagination.total_pages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (page >= pagination.total_pages - 2) {
                                                    pageNum = pagination.total_pages - 4 + i;
                                                } else {
                                                    pageNum = page - 2 + i;
                                                }
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={page === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setPage(pageNum)}
                                                        className="w-9"
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page === pagination.total_pages}
                                        >
                                            Selanjutnya
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-600" />
                            Detail Laporan Whistleblowing
                        </DialogTitle>
                    </DialogHeader>
                    {selectedReport && (
                        <div className="overflow-y-auto flex-1 pr-2">
                            <div className="space-y-6 py-4">
                                {/* Contact Info */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <h3 className="font-semibold text-sm">Informasi Kontak (Anonim)</h3>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-gray-500">Email</p>
                                                <p className="font-medium">{selectedReport.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Telepon</p>
                                                <p className="font-medium">{selectedReport.phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Gender</p>
                                                <p className="font-medium">{selectedReport.gender}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <p className="text-gray-500 mb-1">Prioritas</p>
                                                {getPriorityBadge(selectedReport.priority)}
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Tanggal Laporan</p>
                                                <p className="font-medium">{formatDate(selectedReport.created_on)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 5W1H Details */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <h3 className="font-semibold text-sm">Detail Kejadian (5W1H)</h3>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 font-medium mb-2">What (Apa yang terjadi)</p>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReport.what}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium mb-2">Where (Dimana kejadian)</p>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReport.where}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium mb-2">When (Kapan kejadian)</p>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReport.when}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium mb-2">Who (Siapa yang terlibat)</p>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReport.who}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium mb-2">How (Bagaimana kejadian)</p>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReport.how}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium mb-2">Evidence (Bukti)</p>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReport.evidence}</p>
                                        </div>
                                        {selectedReport.description && (
                                            <div>
                                                <p className="text-gray-500 font-medium mb-2">Deskripsi Tambahan</p>
                                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReport.description}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Files */}
                                {selectedReport.files && selectedReport.files.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <h3 className="font-semibold text-sm">File Lampiran</h3>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {selectedReport.files.map((file, index) => {
                                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
                                                    const fileUrl = getImageUrl(file);
                                                    return (
                                                        <div key={index} className="relative group">
                                                            {isImage ? (
                                                                <div 
                                                                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                                                    onClick={() => setPreviewImage(fileUrl)}
                                                                >
                                                                    <img 
                                                                        src={fileUrl} 
                                                                        alt={`Evidence ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                                                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4">
                                                                    <FileText className="h-8 w-8 text-gray-400 mb-2" />
                                                                    <span className="text-xs text-gray-600 text-center truncate w-full">
                                                                        {file.split('/').pop()}
                                                                    </span>
                                                                    <Button variant="ghost" size="sm" className="mt-2" asChild>
                                                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                                                            <Download className="h-3 w-3 mr-1" />
                                                                            Download
                                                                        </a>
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Status Update */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <h3 className="font-semibold text-sm">Update Status & Catatan Internal</h3>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                Status
                                            </label>
                                            <Select value={newStatus} onValueChange={setNewStatus}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Baru">Baru</SelectItem>
                                                    <SelectItem value="Diproses">Diproses</SelectItem>
                                                    <SelectItem value="Selesai">Selesai</SelectItem>
                                                    <SelectItem value="Ditolak">Ditolak</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                Catatan Internal (Tidak terlihat oleh pelapor)
                                            </label>
                                            <Textarea
                                                value={internalNotes}
                                                onChange={(e) => setInternalNotes(e.target.value)}
                                                placeholder="Tulis catatan internal untuk tim..."
                                                rows={4}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="border-t pt-4">
                        <Button variant="outline" onClick={() => setSelectedReport(null)}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleUpdateStatus}
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Preview Gambar</DialogTitle>
                    </DialogHeader>
                    {previewImage && (
                        <div className="relative">
                            <img 
                                src={previewImage} 
                                alt="Preview" 
                                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                            />
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="absolute top-2 right-2"
                                asChild
                            >
                                <a href={previewImage} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </a>
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
