using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

namespace CapybaraHub
{
    public enum CapyWorkMode
    {
        WpsDocument = 1,
        DataAnalytics = 2,
        CapCutVideo = 3,
        PersonalFinance = 4
    }

    public class CapyModeInfo
    {
        public CapyWorkMode Mode;
        public string ShortTitle;
        public string BadgeText;
        public string SubagentId;
        public string SubagentName;
        public string DefaultVoiceSample;
        public string[] PreviewDeliverables;
    }

    public static class CapyHubEngine
    {
        public static string GetHubRoot()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            if (File.Exists(Path.Combine(baseDir, "package.json")))
                return baseDir;
            DirectoryInfo parent = Directory.GetParent(baseDir);
            if (parent != null && File.Exists(Path.Combine(parent.FullName, "package.json")))
                return parent.FullName;
            return baseDir;
        }

        public static List<CapyModeInfo> GetModes()
        {
            return new List<CapyModeInfo>
            {
                new CapyModeInfo
                {
                    Mode = CapyWorkMode.WpsDocument,
                    ShortTitle = "1. Văn Bản WPS",
                    BadgeText = "WORD / PDF",
                    SubagentId = "scribe-capy-wps-doc",
                    SubagentName = "Scribe Capy",
                    DefaultVoiceSample = "Đọc các tài liệu trong thư mục đầu vào, đối chiếu các điểm chính và xuất báo cáo WPS gọn đẹp cho tôi.",
                    PreviewDeliverables = new string[]
                    {
                        "• Trang 1: Tóm tắt 3 ý chính ngắn gọn đúng văn phong cá nhân của bạn",
                        "• Trang 2: Bảng đối chiếu đa tài liệu kèm trích dẫn [Nguồn - Trang]",
                        "• File xuất: 02_KetQua_NghiemThu/BaoCao_WPS.docx (An toàn, không đè file đang mở)"
                    }
                },
                new CapyModeInfo
                {
                    Mode = CapyWorkMode.DataAnalytics,
                    ShortTitle = "2. Phân Tích Số Liệu",
                    BadgeText = "EXCEL / DATA",
                    SubagentId = "abacus-capy-data-analyst",
                    SubagentName = "Abacus Capy",
                    DefaultVoiceSample = "Phân tích bảng số liệu tháng này, tìm khoản vượt định mức và lập bảng tổng hợp 4 cột chuẩn VNĐ.",
                    PreviewDeliverables = new string[]
                    {
                        "• Tính toán 100% bằng Python (Không tính nhẩm, tự lọc dòng bị trùng)",
                        "• Bảng 4 cột: Hạng mục | Kỳ trước | Kỳ này | Chênh lệch & % Tỷ trọng",
                        "• File xuất: 02_KetQua_NghiemThu/Bang_DoiSoat_Clean.csv (Đã qua QA kiểm toán)"
                    }
                },
                new CapyModeInfo
                {
                    Mode = CapyWorkMode.CapCutVideo,
                    ShortTitle = "3. Edit Video CapCut",
                    BadgeText = "CAPCUT MCP",
                    SubagentId = "director-capy-capcut-editor",
                    SubagentName = "Director Capy",
                    DefaultVoiceSample = "Dựng video CapCut 45 giây từ project nháp, cắt bỏ khoảng lặng và chèn phụ đề nổi bật.",
                    PreviewDeliverables = new string[]
                    {
                        "• Sao lưu bản nháp an toàn trên CapCut trước khi cắt ghép timeline",
                        "• Cắt khoảng lặng > 0.6s, chèn phụ đề 4-7 từ/dòng nhấn màu Cam Yuzu",
                        "• Tự động chạy capcut_validate (0 lỗi đè track) và lưu vào CapCut"
                    }
                },
                new CapyModeInfo
                {
                    Mode = CapyWorkMode.PersonalFinance,
                    ShortTitle = "4. App Tài Chính Riêng",
                    BadgeText = "CAPYFINANCE",
                    SubagentId = "treasurer-capy-finance-coder",
                    SubagentName = "Treasurer Capy",
                    DefaultVoiceSample = "Cập nhật phần mềm quản lý tài chính cá nhân của tôi: đối soát 5 hũ ngân sách và thêm cảnh báo chi tiêu.",
                    PreviewDeliverables = new string[]
                    {
                        "• Kiểm toán sổ cái Zero-Sum (Số dư ròng === Tổng Thu - Tổng Chi)",
                        "• Tự động code nâng cấp giao diện & công thức theo đúng ý bạn",
                        "• Lưu dữ liệu 100% offline trên máy cá nhân + Chạy pass toàn bộ Unit Test"
                    }
                }
            };
        }

        private static readonly string[][] BuiltInVietlishPairs = new string[][]
        {
            new string[] { @"\b(vê\s*kép\s*pi\s*ét|đắp\s*lưu\s*pi\s*ét|đắp\s*lưu\s*bi\s*ét|vê\s*đúp\s*pi\s*ét|w\s*b\s*s|w\s*p\s*s)(?!\s+office)\b", "WPS Office" },
            new string[] { @"\b(cáp\s*cắt|cắp\s*cắt|cáp\s*cất|cap\s*cut)\b", "CapCut" },
            new string[] { @"\b(sấp\s*ây\s*gần|sắp\s*ây\s*gần|súp\s*ây\s*gần|sắp\s*ê\s*gần|sub\s*ây\s*gần|sấp\s*ê\s*giần|sắp\s*agent)\b", "subagent" },
            new string[] { @"\b(ây\s*gần|ê\s*gần|ê\s*giần)\b", "agent" },
            new string[] { @"\b(ha\s*nét|ha\s*nết|hơ\s*nét|hơ\s*nít)\b", "harness" },
            new string[] { @"\b(con\s*phơm|cần\s*phơm|cơn\s*phơm|còn\s*phơm)\b", "confirm" },
            new string[] { @"\b(pờ\s*rôm|câu\s*rôm|chạy\s*rôm)\b", "prompt" },
            new string[] { @"\b(tát\s*vụ|chia\s*tát|nhận\s*tát|giao\s*tát|làm\s*tát|xử\s*lý\s*tát)\b", "task" },
            new string[] { @"\b(sờ\s*kiu|sờ\s*kin|mắt\s*sờ\s*kiu|max\s*sờ\s*kiu)\b", "skill" },
            new string[] { @"\b(ích\s*seo|éc\s*seo)\b", "Excel" },
            new string[] { @"\b(pao\s*ơ\s*poi|pao\s*vơ\s*poi)\b", "PowerPoint" },
            new string[] { @"\b(bi\s*đi\s*ép|pi\s*đi\s*ép)\b", "PDF" },
            new string[] { @"\b(sờ\s*lai|sơ\s*lai)\b", "slide" },
            new string[] { @"\b(đa\s*ta|đê\s*ta)\b", "data" },
            new string[] { @"\b(ê\s*đít|ờ\s*đít)\b", "edit" },
            new string[] { @"\b(tham\s*lai|thai\s*lai)\b", "timeline" },
            new string[] { @"\b(vi\s*đê\s*ô|vi\s*đi\s*ô)\b", "video" },
            new string[] { @"\b(tem\s*pờ\s*lết|tem\s*lết)\b", "template" },
            new string[] { @"\b(pho\s*mát|phó\s*mát)\b", "format" },
            new string[] { @"\b(ắp\s*đết|ấp\s*đết)\b", "update" },
            new string[] { @"\b(ri\s*viu|rì\s*viu)\b", "review" },
            new string[] { @"\b(ri\s*pọt|rì\s*pọt)\b", "report" },
            new string[] { @"\b(đát\s*bo|đát\s*bót)\b", "dashboard" },
            new string[] { @"\b(cát\s*phờ\s*lâu)\b", "cashflow" },
            new string[] { @"\b(guộc\s*phờ\s*lâu|guốc\s*phờ\s*lâu)\b", "workflow" },
            new string[] { @"\b(phôn\s*đơ|phâu\s*đơ)\b", "folder" },
            new string[] { @"\b(gít\s*hấp|gít\s*hắp)\b", "GitHub" },
            new string[] { @"\b(ca\s*pi\s*ba\s*ra|ca\s*bi\s*ba\s*ra)\b", "Capybara" },
            new string[] { @"\b(bút\s*tông|bất\s*tần)\b", "button" },
            new string[] { @"\b(in\s*pút)\b", "input" },
            new string[] { @"\b(ao\s*pút)\b", "output" }
        };

        public static string NormalizeVoiceText(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return "";
            string s = raw.Trim();

            // 1. Load custom phonetic mappings from VOICE-GLOSSARY.md if present
            try
            {
                string hubRoot = GetHubRoot();
                string[] glossaryFiles = new string[]
                {
                    Path.Combine(hubRoot, "03_HoSo_TriNho_CaNhan", "VOICE-GLOSSARY.md"),
                    Path.Combine(hubRoot, "03_HoSo_TriNho_CaNhan", "VOICE-GLOSSARY.template.md")
                };
                foreach (string gf in glossaryFiles)
                {
                    if (!File.Exists(gf)) continue;
                    foreach (string line in File.ReadAllLines(gf, Encoding.UTF8))
                    {
                        string t = line.Trim();
                        if (!t.StartsWith("|") || t.Contains("spokenPhrase") || t.Contains("---")) continue;
                        string[] parts = t.Trim('|').Split('|');
                        if (parts.Length >= 2)
                        {
                            string spokenList = parts[0].Trim().Trim('`');
                            string targetTerm = parts[1].Trim().Trim('`');
                            if (string.IsNullOrEmpty(spokenList) || string.IsNullOrEmpty(targetTerm) || targetTerm.StartsWith("[TRIGGER"))
                                continue;
                            foreach (string ph in spokenList.Split(','))
                            {
                                string cleanPh = ph.Trim().Trim('`');
                                if (cleanPh.Length > 1)
                                {
                                    s = Regex.Replace(s, @"(?i)\b" + Regex.Escape(cleanPh) + @"\b", targetTerm);
                                }
                            }
                        }
                    }
                }
            }
            catch { }

            // 2. Apply built-in Viet-lish phonetic rules
            foreach (string[] pair in BuiltInVietlishPairs)
            {
                s = Regex.Replace(s, "(?i)" + pair[0], pair[1]);
            }

            s = Regex.Replace(s, @"(?i)(?:^|\s)(à\s*ừm|à\s*khoan|ừm\s*thì)(?=\s|$)", " ");
            while (s.Contains("  ")) s = s.Replace("  ", " ");
            return s.Trim();
        }

        public static bool AddCustomVietlishRule(string hubRoot, string spokenVietlish, string englishTarget)
        {
            if (string.IsNullOrWhiteSpace(spokenVietlish) || string.IsNullOrWhiteSpace(englishTarget))
                return false;

            string memDir = Path.Combine(hubRoot, "03_HoSo_TriNho_CaNhan");
            Directory.CreateDirectory(memDir);
            string newLine = "| `" + spokenVietlish.Trim() + "` | `" + englishTarget.Trim() + "` | `custom` |" + Environment.NewLine;

            string[] targets = new string[]
            {
                Path.Combine(memDir, "VOICE-GLOSSARY.md"),
                Path.Combine(memDir, "VOICE-GLOSSARY.template.md")
            };

            foreach (string path in targets)
            {
                try
                {
                    if (!File.Exists(path) && File.Exists(targets[1]))
                    {
                        File.Copy(targets[1], path, false);
                    }
                    if (File.Exists(path))
                    {
                        File.AppendAllText(path, newLine, new UTF8Encoding(false));
                    }
                }
                catch { }
            }
            return true;
        }

        public static string WriteBlueprintAndTaskFiles(
            string hubRoot,
            string workDir,
            CapyModeInfo modeInfo,
            string userVoicePrompt,
            int revision,
            bool isApprovedToExecute)
        {
            string cleanVoice = NormalizeVoiceText(userVoicePrompt);
            string handoffDir = Path.Combine(hubRoot, "04_BanGiao_SubAgents");
            Directory.CreateDirectory(handoffDir);

            string stageStr = isApprovedToExecute ? "APPROVED_FOR_SUBAGENT_EXECUTION" : "AWAITING_USER_CONFIRM";
            StringBuilder bp = new StringBuilder();
            bp.AppendLine("---");
            bp.AppendLine("blueprint_id: BP-" + DateTime.Now.ToString("yyyyMMdd-HHmm"));
            bp.AppendLine("revision: " + revision);
            bp.AppendLine("stage: " + stageStr);
            bp.AppendLine("mode: " + modeInfo.ShortTitle);
            bp.AppendLine("coordinator: boss-capy-coordinator");
            bp.AppendLine("worker_subagent: " + modeInfo.SubagentId);
            bp.AppendLine("qa_subagent: inspector-capy-continuous-qa");
            bp.AppendLine("working_directory: \"" + workDir.Replace("\\", "/") + "\"");
            bp.AppendLine("---");
            bp.AppendLine("# Bản Hình Dung Kết Quả Cuối (Lần #" + revision + ")");
            bp.AppendLine();
            bp.AppendLine("## 1. Yêu Cầu Đã Nhận Từ Mic (Đã Chuẩn Hóa Việt - Anh)");
            bp.AppendLine("> " + cleanVoice);
            bp.AppendLine();
            bp.AppendLine("## 2. Kết Quả Bạn Sẽ Nhận Được");
            foreach (string line in modeInfo.PreviewDeliverables)
            {
                bp.AppendLine(line);
            }
            bp.AppendLine();
            bp.AppendLine("## 3. Luồng Bàn Giao & QA Liên Tục");
            bp.AppendLine("- TASK-01 (" + modeInfo.SubagentId + ") -> Xuất `04_BanGiao_SubAgents/TASK-01_HANDOFF.md`");
            bp.AppendLine("- QA Gate (`inspector-capy-continuous-qa`) -> Kiểm tra & đóng dấu `PASS` vào `TASK-01_QA-VERDICT.md` trước khi mở task mới.");
            bp.AppendLine("- Memory (`long-term-style-memory`) -> Tự động cập nhật sở thích trình bày vào `03_HoSo_TriNho_CaNhan/USER-STYLE-DNA.md`.");

            string bpPath = Path.Combine(handoffDir, "CURRENT-BLUEPRINT.md");
            File.WriteAllText(bpPath, bp.ToString(), new UTF8Encoding(false));

            string taskFile = Path.Combine(hubRoot, ".capy-task.md");
            StringBuilder tf = new StringBuilder();
            if (!isApprovedToExecute)
            {
                tf.AppendLine("[CHẾ ĐỘ CONFIRM TRƯỚC KHI LÀM — CẤM THỰC THI NGAY]");
                tf.AppendLine("Hãy đọc `.harness-plugin/rules/AGENTS.md`, `03_HoSo_TriNho_CaNhan/USER-STYLE-DNA.md` và `04_BanGiao_SubAgents/CURRENT-BLUEPRINT.md`.");
                tf.AppendLine("Khảo sát dữ liệu/tài liệu trong `" + workDir + "` ở chế độ Read-Only, phân tích yêu cầu: \"" + cleanVoice + "\" và trình bày Bản Hình Dung Kết Quả Cuối chi tiết để tôi đọc lại và Confirm!");
            }
            else
            {
                tf.AppendLine("[ĐÃ ĐỒNG Ý CONFIRM — BẮT ĐẦU CHIA TASK CHO SUBAGENTS & CHẠY QA LIÊN TỤC]");
                tf.AppendLine("Người dùng đã ĐỒNG Ý Bản Hình Dung Kết Quả Cuối tại `04_BanGiao_SubAgents/CURRENT-BLUEPRINT.md` (Lần #" + revision + ").");
                tf.AppendLine("Hãy điều phối `" + modeInfo.SubagentId + "` thực thi yêu cầu: \"" + cleanVoice + "\", xuất file bàn giao `04_BanGiao_SubAgents/TASK-01_HANDOFF.md` chuẩn YAML Frontmatter, gọi `inspector-capy-continuous-qa` nghiệm thu liên tục giữa các task và cập nhật `03_HoSo_TriNho_CaNhan/USER-STYLE-DNA.md` khi hoàn tất!");
            }
            File.WriteAllText(taskFile, tf.ToString(), new UTF8Encoding(false));
            return taskFile;
        }

        public static void LaunchCliAgent(string cliId, string hubRoot, bool isApproved)
        {
            string actionTag = isApproved ? "ĐỒNG Ý THỰC THI & QA LIÊN TỤC" : "PHÂN TÍCH & CONFIRM KẾT QUẢ CUỐI";
            string shortInstruction = isApproved
                ? "Doc file .capy-task.md va 04_BanGiao_SubAgents/CURRENT-BLUEPRINT.md (da duoc nguoi dung Confirm). Chia task cho Subagent thuc thi, xuat TASK-01_HANDOFF.md va chay inspector-capy-continuous-qa nghiem thu!"
                : "Doc file .capy-task.md va 04_BanGiao_SubAgents/CURRENT-BLUEPRINT.md. Phan tich du lieu o che do Read-Only va trinh bay Hinh Dung Ket Qua Cuoi chi tiet de nguoi dung Confirm (KHONG thuc thi ngay)!";

            string cmdLine;
            if (cliId == "claude")
                cmdLine = "claude --dangerously-skip-permissions \"" + shortInstruction + "\"";
            else if (cliId == "codex")
                cmdLine = "codex --sandbox danger-full-access -a never \"" + shortInstruction + "\"";
            else
                cmdLine = "agy --dangerously-skip-permissions -i \"" + shortInstruction + "\"";

            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/K title [Capybara AI Hub - " + actionTag + "] && cd /d \"" + hubRoot + "\" && " + cmdLine,
                WorkingDirectory = hubRoot,
                UseShellExecute = true
            };
            Process.Start(psi);
        }
    }
}
