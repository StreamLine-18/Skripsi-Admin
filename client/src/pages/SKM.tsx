import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { skmApi, type SKMSurvey } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Download, BarChart3, Users, TrendingUp, Calendar, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
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
  
  // Month/Year for analytics
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

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
    queryKey: ["skm-surveys", page, searchField, searchValue, selectedMonth, selectedYear],
    queryFn: () => {
      const params: any = { page, pageSize: 10, month: selectedMonth, year: selectedYear };
      if (searchValue) {
        params.searchField = searchField;
        params.searchValue = searchValue;
        return skmApi.searchSurveys(params);
      }
      return skmApi.getSurveys(params);
    },
  });


  const { data: analyticsResponse } = useQuery({
    queryKey: ["skm-analytics", selectedMonth, selectedYear],
    queryFn: () => skmApi.getAnalytics({ 
      month: selectedMonth, 
      year: selectedYear 
    }),
  });

  const surveys = surveysResponse?.data || [];
  const pagination = surveysResponse?.pagination;
  const analytics = analyticsResponse?.data;

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth() + 1;

  const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];


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

      {/* Stats Cards - From Analytics */}
      {analytics?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* IKM Score */}
          <Card className={`bg-gradient-to-br ${
            analytics.summary.ikm_score.color === 'green' ? 'from-green-50 to-green-100 border-green-200' :
            analytics.summary.ikm_score.color === 'blue' ? 'from-blue-50 to-blue-100 border-blue-200' :
            analytics.summary.ikm_score.color === 'yellow' ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
            'from-red-50 to-red-100 border-red-200'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Skor IKM</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {analytics.summary.ikm_score.converted.toFixed(2)}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${
                    analytics.summary.ikm_score.color === 'green' ? 'text-green-700' :
                    analytics.summary.ikm_score.color === 'blue' ? 'text-blue-700' :
                    analytics.summary.ikm_score.color === 'yellow' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {analytics.summary.ikm_score.category}
                  </p>
                </div>
                <div className={`h-14 w-14 rounded-xl flex items-center justify-center shadow-lg ${
                  analytics.summary.ikm_score.color === 'green' ? 'bg-green-500' :
                  analytics.summary.ikm_score.color === 'blue' ? 'bg-blue-500' :
                  analytics.summary.ikm_score.color === 'yellow' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Responses */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Survei</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">
                    {analytics.summary.total_responses.value}
                  </p>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    Responden
                  </p>
                </div>
                <div className="h-14 w-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Dimension */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm font-medium text-purple-700">Dimensi Terbaik</p>
                  <p className="text-sm font-semibold text-purple-900 mt-1 h-10 overflow-hidden leading-tight">
                    {analytics.summary.best_dimension.label}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Skor: {analytics.summary.best_dimension.score.toFixed(2)}/4
                  </p>
                </div>
                <div className="h-14 w-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lowest Dimension */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm font-medium text-orange-700">Perlu Perbaikan</p>
                  <p className="text-sm font-semibold text-orange-900 mt-1 h-10 overflow-hidden leading-tight">
                    {analytics.summary.lowest_dimension.label}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Skor: {analytics.summary.lowest_dimension.score.toFixed(2)}/4
                  </p>
                </div>
                <div className="h-14 w-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Age */}
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700">Rata-rata Usia</p>
                  <p className="text-3xl font-bold text-indigo-900 mt-1">
                    {analytics.summary.average_age.value}
                  </p>
                  <p className="text-xs text-indigo-600 font-medium mt-1">
                    Tahun
                  </p>
                </div>
                <div className="h-14 w-14 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Section - Always Show */}
      {analytics && (
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Filter Periode Analitik</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="px-4 py-2 bg-white rounded-lg min-w-[140px] text-center border">
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextMonth}
                    disabled={isCurrentMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Charts */}
      {analytics && analytics.summary?.total_responses?.value > 0 ? (
        <>

          {/* Dimension Scores Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Skor per Dimensi Pelayanan</CardTitle>
              <CardDescription>Rata-rata penilaian untuk setiap dimensi (skala 1-4)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.dimension_scores} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 4]} stroke="#6b7280" fontSize={12} />
                  <YAxis type="category" dataKey="label" width={200} stroke="#6b7280" fontSize={11} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg border shadow-lg">
                            <p className="text-sm font-medium text-gray-900">{payload[0].payload.label}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Skor: <span className="font-semibold text-blue-600">{(payload[0].value as number).toFixed(2)}/4</span>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Demographics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Gender</CardTitle>
                <CardDescription>Persentase responden berdasarkan gender</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.gender_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.gender_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg border shadow-lg">
                              <p className="text-sm font-medium text-gray-900">{data.gender}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Jumlah: <span className="font-semibold">{data.count} responden</span>
                              </p>
                              <p className="text-xs text-gray-600">
                                Persentase: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-4">
                  {analytics.gender_distribution.map((entry, index) => (
                    <div key={entry.gender} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm text-gray-600">{entry.gender}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Usia</CardTitle>
                <CardDescription>Jumlah responden per kelompok usia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.age_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-lg border shadow-lg">
                              <p className="text-sm font-medium text-gray-900">Usia {payload[0].payload.label}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Jumlah: <span className="font-semibold">{payload[0].value} responden</span>
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Education Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Pendidikan</CardTitle>
                <CardDescription>Jumlah responden per tingkat pendidikan</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.education_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="education" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-lg border shadow-lg">
                              <p className="text-sm font-medium text-gray-900">{payload[0].payload.education}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Jumlah: <span className="font-semibold">{payload[0].value} responden</span>
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Survey Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tren Survei Harian</CardTitle>
                <CardDescription>Jumlah survei yang masuk per hari</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.daily_survey_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280" 
                      fontSize={10}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-lg border shadow-lg">
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(payload[0].payload.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Survei: <span className="font-semibold">{payload[0].value}</span>
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : analytics && analytics.summary?.total_responses?.value === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Data Survei</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Belum ada data survei untuk periode {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}. 
                Silakan pilih periode lain atau tunggu hingga ada survei yang masuk.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mt-2 mb-4">
            <div>
              <CardTitle>Daftar Survei</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Periode: {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
            </div>
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
          <div className="mt-4 flex flex-wrap gap-3">
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
