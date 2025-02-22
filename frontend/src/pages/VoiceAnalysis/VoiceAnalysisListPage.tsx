import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { AnalysisResponse, AnalysisItem } from "../../shared/types/analysis";
import Pagination from "@mui/material/Pagination";
import MetricsVisualizer from "../../shared/components/VoiceQuality/MetricsVisualizer";
import { DeleteIcon } from "../../shared/components/Icons/DeleteIcon";
import Swal from "sweetalert2";
import "../SituationPractice/SwalStyles.css";
import { AnalysisDelete } from "../../services/VoiceAnalysis/VoiceAnalysisPost";

function VoiceAnalysisListPage() {
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(
    null
  );
  const [page, setPage] = useState(1);

  const fetchAnalysisList = async (pageNum: number) => {
    try {
      const response = await axiosInstance.get(
        `/record?page=${pageNum - 1}&size=10`
      );
      setAnalysisData(response.data.data);
    } catch (error) {
      console.error("분석 목록 조회 실패:", error);
    }
  };

  useEffect(() => {
    fetchAnalysisList(page);
  }, [page]);

  // 전체 평가 등급 계산
  const calculateOverallGrade = (
    metrics: AnalysisItem["analyzeResult"]["metrics"]
  ) => {
    const grades = Object.values(metrics).map((m) => m.grade);
    const excellent = grades.filter((g) => g === "excellent").length;
    const good = grades.filter((g) => g === "good").length;

    if (excellent >= 5) return "최상";
    if (excellent + good >= 5) return "양호";
    return "개선 필요";
  };

  const handleDelete = (recordId: number) => {
    Swal.fire({
      title: "대본을 삭제하시겠습니까?",
      showDenyButton: true,
      confirmButtonText: "삭제",
      denyButtonText: `취소`,
      customClass: {
        confirmButton: "swal2-confirm-btn", // 삭제 버튼
        denyButton: "swal2-deny-btn", // 취소 버튼
      },
      buttonsStyling: false,
    }).then(async (result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        try {
          const response = await AnalysisDelete(recordId);
          void response; // 주석된 콘솔 출력 유지용. 빌드오류 방지용 코드로 역할 없음
          // console.log(response);

          setAnalysisData((prevData) => ({
            ...prevData!,
            content: prevData!.content.filter(
              (item) => item.recordId !== recordId
            ),
          }));
        } catch (_e) {
          // console.log(e);
        }
      }
    });
  };

  return (
    <div className="voice-analysis-list p-4 md:p-8 lg:max-w-5xl lg:mx-auto" role="main">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">
        음성 분석 목록
      </h1>
      {analysisData?.content.length ? (
        <>
          <div className="analysis-items bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 space-y-4">
            {analysisData.content.map((item) => (
              <div
                key={item.recordId}
                className="p-3 md:p-4 border-b border-white/30 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate(`/analysis/${item.recordId}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/analysis/${item.recordId}`);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${item.title} 분석 결과 보기`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                      <div className="flex items-center gap-2 mb-2 sm:mb-0">
                        <h2 className="text-lg md:text-xl font-semibold text-white">
                          {item.title}
                        </h2>
                        <DeleteIcon
                          onClick={() => handleDelete(item.recordId)}
                          strokeColor="#4CC9FE"
                        />
                      </div>
                      <span className="text-sm text-white/80">
                        {item.createdAt}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                      <div
                        className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-center whitespace-nowrap ${
                          calculateOverallGrade(item.analyzeResult.metrics) ===
                          "최상"
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/50"
                            : calculateOverallGrade(
                                item.analyzeResult.metrics
                              ) === "양호"
                            ? "bg-blue-500/30 text-blue-300 border border-blue-400/50"
                            : "bg-rose-500/30 text-rose-300 border border-rose-400/50"
                        }`}
                        role="status"
                        aria-label={`전체 평가: ${calculateOverallGrade(item.analyzeResult.metrics)}`}
                      >
                        {calculateOverallGrade(item.analyzeResult.metrics)}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 md:gap-4 text-white/90 text-sm md:text-base">
                        <div className="flex items-center gap-2">
                          <span>명료도:</span>
                          <span
                            className={
                              item.analyzeResult.metrics["명료도(Clarity)"]
                                .grade === "excellent"
                                ? "text-emerald-300"
                                : item.analyzeResult.metrics["명료도(Clarity)"]
                                    .grade === "good"
                                ? "text-blue-300"
                                : "text-rose-300"
                            }
                          >
                            {
                              item.analyzeResult.metrics["명료도(Clarity)"]
                                .grade
                            }
                          </span>
                        </div>
                        <span className="hidden sm:block text-white/30" aria-hidden="true">|</span>
                        <div className="flex items-center gap-2">
                          <span>발화 에너지:</span>
                          <span
                            className={
                              item.analyzeResult.metrics[
                                "발화의 에너지(Utterance Energy)"
                              ].grade === "excellent"
                                ? "text-emerald-300"
                                : item.analyzeResult.metrics[
                                    "발화의 에너지(Utterance Energy)"
                                  ].grade === "good"
                                ? "text-blue-300"
                                : "text-rose-300"
                            }
                          >
                            {
                              item.analyzeResult.metrics[
                                "발화의 에너지(Utterance Energy)"
                              ].grade
                            }
                          </span>
                        </div>
                        <span className="hidden sm:block text-white/30" aria-hidden="true">|</span>
                        <div className="flex items-center gap-2">
                          <span>멜로디:</span>
                          <span
                            className={
                              item.analyzeResult.metrics[
                                "멜로디 지수(Melody Index)"
                              ].grade === "excellent"
                                ? "text-emerald-300"
                                : item.analyzeResult.metrics[
                                    "멜로디 지수(Melody Index)"
                                  ].grade === "good"
                                ? "text-blue-300"
                                : "text-rose-300"
                            }
                          >
                            {
                              item.analyzeResult.metrics[
                                "멜로디 지수(Melody Index)"
                              ].grade
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] flex-shrink-0 mx-auto md:mx-0">
                    <MetricsVisualizer
                      metrics={item.analyzeResult.metrics}
                      showLabels={false}
                      colorScheme={
                        calculateOverallGrade(item.analyzeResult.metrics) ===
                        "최상"
                          ? "green"
                          : calculateOverallGrade(
                              item.analyzeResult.metrics
                            ) === "양호"
                          ? "blue"
                          : "red"
                      }
                      aria-label={`${item.title}의 메트릭 시각화`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <nav className="flex justify-center mt-6" aria-label="페이지 네비게이션">
            <Pagination
              count={analysisData.totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              sx={{
                "& .MuiPaginationItem-root": {
                  color: "#fff",
                  fontSize: "1.1rem",
                },
                "& .Mui-selected": {
                  backgroundColor: "rgba(255, 255, 255, 0.3) !important",
                },
              }}
            />
          </nav>
        </>
      ) : (
        <p className="text-center text-white p-6 md:p-10 bg-white/10 backdrop-blur-sm rounded-lg mt-4 md:mt-6" role="status">
          분석 기록이 없습니다.
        </p>
      )}
    </div>
  );
}

export default VoiceAnalysisListPage;
