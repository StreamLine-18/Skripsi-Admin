import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { skmApi, type SKMSurvey } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Download, BarChart3, Users, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
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
} from "@/components/ui/dialog";

export default function SKM() {
  const { toast } = useToast();
  const [searchField, setSearchField] = useState("service_type");
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState<SKMSurvey | null>(null);
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchValue(searchInput);
      setPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle export
  const handleExport = async () => {
    try {
      toast({
        title: "Mengunduh...",
        description: "Sedang memproses export data",
      });

      const params: any = {};
      if (searchValue) {
        params.searchField = searchField;
        params.searchValue = searchValue;
      }

      const blob = await skmApi.exportSurveys(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skm-surveys-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Berhasil",
        description: "Data berhasil diexport",
      });
    } catch (error) {
      toast({
        title: "Gagal",
        description: "Gagal mengexport data",
        variant: "destructive",
      });
    }
  };

  const { data: surveysResponse, isLoading } = useQuery({
    queryKey: ["skm-surveys", page, searchField, searchValue],
    queryFn: () => {
      if (searchValue) {
        return skmApi.searchSurveys({ 
          page, 
          pageSize: 10, 
          searchField, 
          searchValue 
        });
      }
      return skmApi.getSurveys({ page, pageSize: 10 });
    },
  });

  const { data: statisticsResponse } = useQuery({
    queryKey: ["skm-statistics"],
    queryFn: skmApi.getStatistics,
  });

  const surveys = surveysResponse?.data || [];
  const pagination = surveysResponse?.pagination;
  const statistics = statisticsResponse?.data;

  // Calculate statistics
  const calculateAverage = (field: keyof SKMSurvey) => {
    if (surveys.length === 0) return 0;
    const sum = surveys.reduce((acc: number, survey: SKMSurvey) => acc + (Number(survey[field]) || 0), 0);
    return (sum / surveys.length).toFixed(2);
  };

  const overallSatisfaction = surveys.length > 0
    ? ((
        Number(calculateAverage("q1_requirement_match")) +
        Number(calculateAverage("q2_procedure_ease")) +
        Number(calculateAverage("q3_time_match")) +
        Number(calculateAverage("q4_cost_match")) +
        Number(calculateAverage("q5_product_match")) +
        Number(calculateAverage("q6a_app_speed")) +
        Number(calculateAverage("q6b_staff_competence")) +
        Number(calculateAverage("q7a_app_ease")) +
        Number(calculateAverage("q7b_staff_behavior")) +
        Number(calculateAverage("q8_complaint_channel")) +
        Number(calculateAverage("q9a_app_content")) +
        Number(calculateAverage("q9b_facilities"))
      ) / 12).toFixed(2)
    : "0.00";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Survei Kepuasan Masyarakat (SKM)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor dan analisis hasil survei kepuasan masyarakat
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Survei</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {statistics?.total_responses || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Skor IKM</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {statistics?.ikm_score.toFixed(2) || "0.00"}
                </p>
                {statistics?.ikm_category && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {statistics.ikm_category}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Dimensi Terbaik</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {statistics?.best_dimension.label || "-"}
                </p>
                {statistics?.best_dimension && (
                  <p className="text-xs text-gray-600 mt-1">
                    Skor: {statistics.best_dimension.score.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Perlu Perbaikan</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {statistics?.lowest_dimension.label || "-"}
                </p>
                {statistics?.lowest_dimension && (
                  <p className="text-xs text-gray-600 mt-1">
                    Skor: {statistics.lowest_dimension.score.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mt-2 mb-8">
            <CardTitle>Daftar Survei</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              disabled={isLoading || surveys.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="mt-4 flex gap-3">
            <Select value={searchField} onValueChange={setSearchField}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service_type">Jenis Layanan</SelectItem>
                <SelectItem value="access_location">Lokasi Akses</SelectItem>
                <SelectItem value="gender">Gender</SelectItem>
                <SelectItem value="education">Pendidikan</SelectItem>
                <SelectItem value="occupation">Pekerjaan</SelectItem>
                <SelectItem value="age">Usia</SelectItem>
                <SelectItem value="q10_feedback">Feedback</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Cari berdasarkan ${searchField === 'service_type' ? 'jenis layanan' : searchField === 'access_location' ? 'lokasi akses' : searchField === 'gender' ? 'gender' : searchField === 'education' ? 'pendidikan' : searchField === 'occupation' ? 'pekerjaan' : searchField === 'age' ? 'usia' : 'feedback'}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada data survei</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Lokasi Akses</TableHead>
                    <TableHead>Jenis Layanan</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Usia</TableHead>
                    <TableHead className="text-center">Rata-rata Nilai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey) => {
                    const avgScore = (
                      (survey.q1_requirement_match +
                        survey.q2_procedure_ease +
                        survey.q3_time_match +
                        survey.q4_cost_match +
                        survey.q5_product_match +
                        survey.q6a_app_speed +
                        survey.q6b_staff_competence +
                        survey.q7a_app_ease +
                        survey.q7b_staff_behavior +
                        survey.q8_complaint_channel +
                        survey.q9a_app_content +
                        survey.q9b_facilities) / 12
                    ).toFixed(2);

                    return (
                      <TableRow key={survey.id_survey}>
                        <TableCell className="font-medium">
                          {formatDate(survey.survey_date)}
                        </TableCell>
                        <TableCell>{survey.access_location}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {survey.service_type}
                        </TableCell>
                        <TableCell>{survey.gender === "L" ? "Laki-laki" : "Perempuan"}</TableCell>
                        <TableCell>{survey.age} tahun</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {avgScore}/4
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSurvey(survey)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Menampilkan <span className="font-medium">{((pagination.page - 1) * pagination.page_size) + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.page_size, pagination.total_records)}</span> dari <span className="font-medium">{pagination.total_records}</span> survei
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
      <Dialog open={!!selectedSurvey} onOpenChange={() => setSelectedSurvey(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl">Detail Survei Kepuasan Masyarakat</DialogTitle>
          </DialogHeader>
          {selectedSurvey && (
            <div className="overflow-y-auto flex-1 pr-2">
              <div className="space-y-6 py-4">
                {/* Overall Score Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Rata-rata Kepuasan</p>
                      <p className="text-4xl font-bold text-blue-600">
                        {(
                          (selectedSurvey.q1_requirement_match +
                            selectedSurvey.q2_procedure_ease +
                            selectedSurvey.q3_time_match +
                            selectedSurvey.q4_cost_match +
                            selectedSurvey.q5_product_match +
                            selectedSurvey.q6a_app_speed +
                            selectedSurvey.q6b_staff_competence +
                            selectedSurvey.q7a_app_ease +
                            selectedSurvey.q7b_staff_behavior +
                            selectedSurvey.q8_complaint_channel +
                            selectedSurvey.q9a_app_content +
                            selectedSurvey.q9b_facilities) / 12
                        ).toFixed(2)}
                        <span className="text-2xl text-gray-600">/4</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Respondent & Service Info Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Respondent Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <h3 className="font-semibold text-sm">Informasi Responden</h3>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Tanggal Survei</span>
                        <span className="font-medium">{formatDate(selectedSurvey.survey_date)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Waktu</span>
                        <span className="font-medium">{selectedSurvey.survey_time}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Lokasi Akses</span>
                        <span className="font-medium">{selectedSurvey.access_location}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Gender</span>
                        <span className="font-medium">{selectedSurvey.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Usia</span>
                        <span className="font-medium">{selectedSurvey.age} tahun</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Pendidikan</span>
                        <span className="font-medium">{selectedSurvey.education}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Pekerjaan</span>
                        <span className="font-medium">{selectedSurvey.occupation}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Disabilitas</span>
                        <span className="font-medium">{selectedSurvey.is_disabled ? selectedSurvey.disability_type : "Tidak"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Service Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <h3 className="font-semibold text-sm">Informasi Layanan</h3>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Jenis Layanan</p>
                        <p className="font-medium bg-gray-50 p-3 rounded-lg">{selectedSurvey.service_type}</p>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">Tanggal Diterima</span>
                        <span className="font-medium">{formatDate(selectedSurvey.service_received_date)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Waktu Layanan</span>
                        <span className="font-medium">{selectedSurvey.service_received_time}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Survey Scores */}
                <Card>
                  <CardHeader className="pb-3">
                    <h3 className="font-semibold text-sm">Penilaian Detail</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      {[
                        { label: "Kesesuaian Persyaratan", value: selectedSurvey.q1_requirement_match },
                        { label: "Kemudahan Prosedur", value: selectedSurvey.q2_procedure_ease },
                        { label: "Kesesuaian Waktu", value: selectedSurvey.q3_time_match },
                        { label: "Kesesuaian Biaya", value: selectedSurvey.q4_cost_match },
                        { label: "Kesesuaian Produk", value: selectedSurvey.q5_product_match },
                        { label: "Kecepatan Aplikasi", value: selectedSurvey.q6a_app_speed },
                        { label: "Kompetensi Petugas", value: selectedSurvey.q6b_staff_competence },
                        { label: "Kemudahan Aplikasi", value: selectedSurvey.q7a_app_ease },
                        { label: "Perilaku Petugas", value: selectedSurvey.q7b_staff_behavior },
                        { label: "Saluran Pengaduan", value: selectedSurvey.q8_complaint_channel },
                        { label: "Konten Aplikasi", value: selectedSurvey.q9a_app_content },
                        { label: "Fasilitas", value: selectedSurvey.q9b_facilities },
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b">
                          <span className="text-gray-600">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4].map((star) => (
                                <div
                                  key={star}
                                  className={`w-4 h-4 rounded-sm ${
                                    star <= item.value ? "bg-yellow-400" : "bg-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-semibold text-gray-900 w-8">{item.value}/4</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Feedback */}
                <Card>
                  <CardHeader className="pb-3">
                    <h3 className="font-semibold text-sm">Saran dan Masukan</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
                      {selectedSurvey.q10_feedback || "Tidak ada saran"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
