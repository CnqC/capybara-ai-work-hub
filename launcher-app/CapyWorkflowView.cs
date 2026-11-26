using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;

namespace CapybaraHub
{
    public class CapyWorkflowView : Border
    {
        private static readonly Color ColBgCanvas = Color.FromRgb(16, 13, 11);
        private static readonly Color ColCard = Color.FromRgb(29, 24, 21);
        private static readonly Color ColBorder = Color.FromRgb(68, 54, 44);
        private static readonly Color ColYuzu = Color.FromRgb(234, 106, 32);
        private static readonly Color ColMatcha = Color.FromRgb(16, 185, 129);
        private static readonly Color ColSky = Color.FromRgb(56, 189, 248);
        private static readonly Color ColTextMain = Color.FromRgb(250, 246, 240);
        private static readonly Color ColTextSub = Color.FromRgb(180, 166, 152);

        public CapyWorkflowView()
        {
            Background = new SolidColorBrush(ColBgCanvas);
            BorderBrush = new SolidColorBrush(ColBorder);
            BorderThickness = new Thickness(1);
            CornerRadius = new CornerRadius(14);
            Padding = new Thickness(22);

            Grid root = new Grid();
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            root.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

            // Top concise bar
            StackPanel header = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 18) };
            header.Children.Add(new TextBlock
            {
                Text = "🌿 SƠ ĐỒ BÀN GIAO ĐÀN CAPYBARA & QA LIÊN TỤC (MAKER != CHECKER)",
                Foreground = new SolidColorBrush(ColTextMain),
                FontSize = 15,
                FontWeight = FontWeights.Bold,
                VerticalAlignment = VerticalAlignment.Center
            });
            Border pill = new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(20, 52, 38)),
                BorderBrush = new SolidColorBrush(ColMatcha),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(10, 4, 10, 4),
                Margin = new Thickness(14, 0, 0, 0)
            };
            pill.Child = new TextBlock
            {
                Text = "● Chuẩn YAML Frontmatter · TASK-01_HANDOFF.md -> QA PASS",
                Foreground = new SolidColorBrush(ColMatcha),
                FontSize = 11.5,
                FontWeight = FontWeights.SemiBold
            };
            header.Children.Add(pill);
            Grid.SetRow(header, 0);
            root.Children.Add(header);

            // 4-Column Pipeline Graph
            Grid cols = new Grid();
            for (int i = 0; i < 4; i++)
            {
                cols.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            }

            cols.Children.Add(CreateStageColumn(0, "PHA 1 · MIC & CONFIRM", ColYuzu, new string[][]
            {
                new string[] { "🎙 Boss Capy (Điều Phối)", "boss-capy-coordinator", "1. Nghe Mic & Khử nhiễu\n2. Lặp Confirm Kết Quả Cuối\n3. Bạn Đồng Ý mới mở khóa", "ACTIVE" }
            }));

            cols.Children.Add(CreateStageColumn(1, "PHA 2 · SUBAGENT THỰC THI", ColSky, new string[][]
            {
                new string[] { "📄 Scribe Capy (WPS)", "scribe-capy-wps-doc", "Văn bản WPS & Đa tài liệu", "READY" },
                new string[] { "📊 Abacus Capy (Data)", "abacus-capy-data-analyst", "Tính số liệu bằng Python", "READY" },
                new string[] { "🎬 Director Capy (CapCut)", "director-capy-capcut-editor", "Cắt video qua capcut-mcp", "READY" },
                new string[] { "💰 Treasurer Capy (Tài Chính)", "treasurer-capy-finance-coder", "Code App Tài chính riêng", "READY" }
            }));

            cols.Children.Add(CreateStageColumn(2, "PHA 3 · FILE BÀN GIAO & QA", ColMatcha, new string[][]
            {
                new string[] { "📦 File Bàn Giao Chuẩn", "04_BanGiao_SubAgents/", "TASK-01_HANDOFF.md\n(Có YAML Frontmatter chuẩn)", "HANDOFF" },
                new string[] { "🔍 Inspector Capy (QA)", "inspector-capy-continuous-qa", "Chạy liên tục sau mỗi task:\nĐóng dấu PASS mới mở task sau", "QA PASS" }
            }));

            cols.Children.Add(CreateStageColumn(3, "PHA 4 · TRÍ NHỚ DÀI HẠN", ColYuzu, new string[][]
            {
                new string[] { "🧠 Học Phong Cách Cá Nhân", "03_HoSo_TriNho_CaNhan/", "USER-STYLE-DNA.md\nVOICE-GLOSSARY.md\nTự thông minh hơn sau mỗi phiên", "SAVED" }
            }));

            Grid.SetRow(cols, 1);
            root.Children.Add(cols);

            // Footer note
            Border footer = new Border
            {
                Background = new SolidColorBrush(ColCard),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(14, 10, 14, 10),
                Margin = new Thickness(0, 14, 0, 0)
            };
            footer.Child = new TextBlock
            {
                Text = "✔ Quy tắc khóa dây chuyền: Inspector Capy kiểm tra từng TASK-XX_HANDOFF.md. Nếu đạt (PASS) mới bàn giao về Boss Capy giao task tiếp theo.",
                Foreground = new SolidColorBrush(ColTextSub),
                FontSize = 12
            };
            Grid.SetRow(footer, 2);
            root.Children.Add(footer);

            Child = root;
        }

        private static UIElement CreateStageColumn(int colIndex, string stageTitle, Color accent, string[][] nodes)
        {
            StackPanel sp = new StackPanel { Margin = new Thickness(8, 0, 8, 0) };

            Border stageHeader = new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(25, 20, 17)),
                BorderBrush = new SolidColorBrush(accent),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(10, 6, 10, 6),
                Margin = new Thickness(0, 0, 0, 12)
            };
            stageHeader.Child = new TextBlock
            {
                Text = stageTitle,
                Foreground = new SolidColorBrush(accent),
                FontSize = 11.5,
                FontWeight = FontWeights.Bold
            };
            sp.Children.Add(stageHeader);

            foreach (string[] n in nodes)
            {
                Border card = new Border
                {
                    Background = new SolidColorBrush(ColCard),
                    BorderBrush = new SolidColorBrush(ColBorder),
                    BorderThickness = new Thickness(1.2),
                    CornerRadius = new CornerRadius(12),
                    Padding = new Thickness(14, 12, 14, 12),
                    Margin = new Thickness(0, 0, 0, 10)
                };

                StackPanel cardSp = new StackPanel();
                DockPanel topRow = new DockPanel { Margin = new Thickness(0, 0, 0, 4) };
                Border badge = new Border
                {
                    Background = new SolidColorBrush(Color.FromArgb(45, accent.R, accent.G, accent.B)),
                    CornerRadius = new CornerRadius(6),
                    Padding = new Thickness(7, 2, 7, 2)
                };
                badge.Child = new TextBlock
                {
                    Text = n[3],
                    Foreground = new SolidColorBrush(accent),
                    FontSize = 10,
                    FontWeight = FontWeights.Bold
                };
                DockPanel.SetDock(badge, Dock.Right);
                topRow.Children.Add(badge);

                topRow.Children.Add(new TextBlock
                {
                    Text = n[0],
                    Foreground = new SolidColorBrush(ColTextMain),
                    FontSize = 13.5,
                    FontWeight = FontWeights.Bold
                });
                cardSp.Children.Add(topRow);

                cardSp.Children.Add(new TextBlock
                {
                    Text = n[1],
                    Foreground = new SolidColorBrush(accent),
                    FontFamily = new FontFamily("Consolas"),
                    FontSize = 11,
                    Margin = new Thickness(0, 0, 0, 6)
                });

                cardSp.Children.Add(new TextBlock
                {
                    Text = n[2],
                    Foreground = new SolidColorBrush(ColTextSub),
                    FontSize = 11.8,
                    TextWrapping = TextWrapping.Wrap
                });

                card.Child = cardSp;
                sp.Children.Add(card);
            }

            Grid.SetColumn(sp, colIndex);
            return sp;
        }
    }
}
