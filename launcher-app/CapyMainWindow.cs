using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace CapybaraHub
{
    public class CapyMainWindow : Window
    {
        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        private static readonly Color ColBgMain = Color.FromRgb(16, 13, 11);       // #100D0B
        private static readonly Color ColBgPanel = Color.FromRgb(24, 20, 17);      // #181411
        private static readonly Color ColBgCard = Color.FromRgb(34, 28, 24);       // #221C18
        private static readonly Color ColBgInput = Color.FromRgb(14, 11, 9);       // #0E0B09
        private static readonly Color ColBorder = Color.FromRgb(66, 53, 43);       // #42352B
        private static readonly Color ColYuzu = Color.FromRgb(234, 106, 32);       // #EA6A20
        private static readonly Color ColMatcha = Color.FromRgb(16, 185, 129);     // #10B981
        private static readonly Color ColSky = Color.FromRgb(56, 189, 248);        // #38BDF8
        private static readonly Color ColTextMain = Color.FromRgb(250, 246, 240);  // #FAF6F0
        private static readonly Color ColTextSub = Color.FromRgb(176, 162, 148);   // #B0A294

        private readonly string _hubRoot;
        private readonly List<CapyModeInfo> _modes;
        private CapyModeInfo _currentMode;
        private string _selectedCli = "agy";
        private int _blueprintRevision = 1;

        private readonly Dictionary<CapyWorkMode, Border> _modeCards = new Dictionary<CapyWorkMode, Border>();
        private readonly Dictionary<string, Border> _cliPills = new Dictionary<string, Border>();

        private Border _rootBorder;
        private Grid _controlPageGrid;
        private CapyWorkflowView _workflowPage;
        private Border _tabControlBtn;
        private TextBlock _tabControlText;
        private Border _tabWorkflowBtn;
        private TextBlock _tabWorkflowText;

        private TextBox _workDirBox;
        private TextBox _voiceInputBox;
        private TextBlock _blueprintHeaderLabel;
        private TextBlock _blueprintPreviewBox;
        private TextBlock _statusLogLabel;

        [STAThread]
        public static void Main(string[] args)
        {
            try
            {
                try { SetProcessDPIAware(); } catch { }
                RenderOptions.ProcessRenderMode = System.Windows.Interop.RenderMode.SoftwareOnly;

                Application app = new Application();
                CapyMainWindow win = new CapyMainWindow();

                if (args != null && args.Length >= 2 && (args[0] == "--screenshot" || args[0] == "--screenshot-workflow"))
                {
                    string outPng = System.IO.Path.GetFullPath(args[1]);
                    string dir = System.IO.Path.GetDirectoryName(outPng);
                    if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

                    win.Width = 1260;
                    win.Height = 700;
                    if (args[0] == "--screenshot-workflow")
                    {
                        win.SwitchPage(1);
                    }
                    win.Show();
                    win.UpdateLayout();

                    Visual target = win._rootBorder != null ? (Visual)win._rootBorder : (Visual)win;
                    FrameworkElement fe = target as FrameworkElement;
                    int w = Math.Max(1, (int)Math.Round(fe != null && fe.ActualWidth > 0 ? fe.ActualWidth : win.Width));
                    int h = Math.Max(1, (int)Math.Round(fe != null && fe.ActualHeight > 0 ? fe.ActualHeight : win.Height));

                    RenderTargetBitmap rtb = new RenderTargetBitmap(w, h, 96.0, 96.0, PixelFormats.Pbgra32);
                    rtb.Render(target);
                    PngBitmapEncoder enc = new PngBitmapEncoder();
                    enc.Frames.Add(BitmapFrame.Create(rtb));
                    using (FileStream fs = File.Create(outPng))
                    {
                        enc.Save(fs);
                    }
                    win.Close();
                    return;
                }

                app.Run(win);
            }
            catch (Exception ex)
            {
                try
                {
                    File.WriteAllText(
                        System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "capyhub-error.log"),
                        ex.ToString());
                }
                catch { }
            }
        }

        public CapyMainWindow()
        {
            _hubRoot = CapyHubEngine.GetHubRoot();
            _modes = CapyHubEngine.GetModes();
            _currentMode = _modes[0];

            Title = "Capybara AI Hub";
            Width = 1260;
            Height = 700;
            MinWidth = 1020;
            MinHeight = 620;
            WindowStartupLocation = WindowStartupLocation.CenterScreen;
            Background = new SolidColorBrush(ColBgMain);
            FontFamily = new FontFamily("Segoe UI");

            AllowDrop = true;
            Drop += OnWindowDrop;

            BuildUi();
            SelectMode(CapyWorkMode.WpsDocument, true);
        }

        private void BuildUi()
        {
            _rootBorder = new Border
            {
                Background = new SolidColorBrush(ColBgMain),
                Padding = new Thickness(18)
            };

            Grid mainGrid = new Grid();
            mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            mainGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });

            UIElement topBar = BuildTopBar();
            Grid.SetRow(topBar, 0);
            mainGrid.Children.Add(topBar);

            Grid pageHost = new Grid { Margin = new Thickness(0, 14, 0, 0) };
            _controlPageGrid = BuildSimpleThreeColumnDashboard();
            _workflowPage = new CapyWorkflowView { Visibility = Visibility.Collapsed };

            pageHost.Children.Add(_controlPageGrid);
            pageHost.Children.Add(_workflowPage);

            Grid.SetRow(pageHost, 1);
            mainGrid.Children.Add(pageHost);

            _rootBorder.Child = mainGrid;
            Content = _rootBorder;
        }

        private UIElement BuildTopBar()
        {
            Border bar = new Border
            {
                Background = new SolidColorBrush(ColBgPanel),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(14),
                Padding = new Thickness(16, 12, 16, 12)
            };

            DockPanel dock = new DockPanel();

            StackPanel navRow = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };

            _tabControlBtn = CreateNavTab("🎙 Bảng Điều Khiển", true, out _tabControlText);
            _tabControlBtn.MouseLeftButtonUp += delegate { SwitchPage(0); };
            navRow.Children.Add(_tabControlBtn);

            _tabWorkflowBtn = CreateNavTab("🌿 Sơ Đồ Subagents & QA", false, out _tabWorkflowText);
            _tabWorkflowBtn.Margin = new Thickness(8, 0, 0, 0);
            _tabWorkflowBtn.MouseLeftButtonUp += delegate { SwitchPage(1); };
            navRow.Children.Add(_tabWorkflowBtn);

            Button openFolderBtn = CreateFlatButton("📂 Thư Mục Hub", ColBgCard, ColTextMain);
            openFolderBtn.Margin = new Thickness(8, 0, 0, 0);
            openFolderBtn.Click += delegate
            {
                Process.Start(new ProcessStartInfo { FileName = "explorer.exe", Arguments = "\"" + _hubRoot + "\"", UseShellExecute = true });
            };
            navRow.Children.Add(openFolderBtn);

            DockPanel.SetDock(navRow, Dock.Right);
            dock.Children.Add(navRow);

            StackPanel left = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
            left.Children.Add(CreateCapybaraAvatarBadge());

            StackPanel titleStack = new StackPanel { Margin = new Thickness(12, 0, 0, 0), VerticalAlignment = VerticalAlignment.Center };
            titleStack.Children.Add(new TextBlock
            {
                Text = "CAPYBARA AI HUB",
                Foreground = new SolidColorBrush(ColTextMain),
                FontSize = 17,
                FontWeight = FontWeights.Bold
            });
            titleStack.Children.Add(new TextBlock
            {
                Text = "● Nói Mic   ->   ● Confirm Kết Quả Cuối   ->   ● Subagents & QA Liên Tục",
                Foreground = new SolidColorBrush(ColMatcha),
                FontSize = 11.5,
                Margin = new Thickness(0, 2, 0, 0)
            });
            left.Children.Add(titleStack);
            dock.Children.Add(left);

            bar.Child = dock;
            return bar;
        }

        private Grid BuildSimpleThreeColumnDashboard()
        {
            Grid g = new Grid();
            g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(300) });
            g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(300) });

            // ==================== COLUMN 1: 1. CHỌN VIỆC ====================
            Border col1 = CreatePanelCard();
            StackPanel s1 = new StackPanel();
            s1.Children.Add(CreateSectionHeader("1. CHỌN ĐẦU VIỆC", ColYuzu));

            foreach (CapyModeInfo m in _modes)
            {
                CapyModeInfo captured = m;
                Border card = new Border
                {
                    Background = new SolidColorBrush(ColBgCard),
                    BorderBrush = new SolidColorBrush(ColBorder),
                    BorderThickness = new Thickness(1.5),
                    CornerRadius = new CornerRadius(12),
                    Padding = new Thickness(14, 12, 14, 12),
                    Margin = new Thickness(0, 0, 0, 10),
                    Cursor = Cursors.Hand
                };

                StackPanel textSp = new StackPanel();
                DockPanel topLine = new DockPanel();
                Border badge = new Border
                {
                    Background = new SolidColorBrush(Color.FromArgb(40, ColYuzu.R, ColYuzu.G, ColYuzu.B)),
                    CornerRadius = new CornerRadius(6),
                    Padding = new Thickness(6, 2, 6, 2),
                    VerticalAlignment = VerticalAlignment.Center
                };
                badge.Child = new TextBlock
                {
                    Text = captured.BadgeText,
                    Foreground = new SolidColorBrush(ColYuzu),
                    FontSize = 9.5,
                    FontWeight = FontWeights.Bold
                };
                DockPanel.SetDock(badge, Dock.Right);
                topLine.Children.Add(badge);

                topLine.Children.Add(new TextBlock
                {
                    Text = captured.ShortTitle,
                    Foreground = new SolidColorBrush(ColTextMain),
                    FontSize = 13.5,
                    FontWeight = FontWeights.Bold
                });
                textSp.Children.Add(topLine);

                textSp.Children.Add(new TextBlock
                {
                    Text = captured.SubagentName + " · QA Liên Tục",
                    Foreground = new SolidColorBrush(ColTextSub),
                    FontSize = 11,
                    Margin = new Thickness(0, 4, 0, 0)
                });

                card.Child = textSp;
                card.MouseLeftButtonUp += delegate { SelectMode(captured.Mode, true); };
                _modeCards[captured.Mode] = card;
                s1.Children.Add(card);
            }

            s1.Children.Add(new TextBlock
            {
                Text = "Thư mục tài liệu (Kéo-thả vào đây):",
                Foreground = new SolidColorBrush(ColTextSub),
                FontSize = 11.5,
                Margin = new Thickness(0, 8, 0, 6)
            });

            DockPanel dirRow = new DockPanel();
            Button pickDirBtn = CreateFlatButton("📁 Chọn", ColBgCard, ColTextMain);
            pickDirBtn.Margin = new Thickness(6, 0, 0, 0);
            pickDirBtn.Click += delegate
            {
                var dlg = new Microsoft.Win32.OpenFileDialog
                {
                    Title = "Chọn file tài liệu WPS / Data hoặc thư mục",
                    CheckFileExists = false,
                    FileName = "Chọn Thư Mục Này"
                };
                if (dlg.ShowDialog() == true)
                {
                    string dir = System.IO.Path.GetDirectoryName(dlg.FileName);
                    if (!string.IsNullOrEmpty(dir)) _workDirBox.Text = dir;
                }
            };
            DockPanel.SetDock(pickDirBtn, Dock.Right);
            dirRow.Children.Add(pickDirBtn);

            _workDirBox = new TextBox
            {
                Text = System.IO.Path.Combine(_hubRoot, "01_TaiLieu_DauVao"),
                Background = new SolidColorBrush(ColBgInput),
                Foreground = new SolidColorBrush(ColTextMain),
                BorderBrush = new SolidColorBrush(ColBorder),
                Padding = new Thickness(10, 7, 10, 7),
                FontSize = 11.5
            };
            dirRow.Children.Add(_workDirBox);
            s1.Children.Add(dirRow);

            col1.Child = s1;
            Grid.SetColumn(col1, 0);
            g.Children.Add(col1);

            // ==================== COLUMN 2: 2. NÓI MIC & CONFIRM ====================
            Border col2 = CreatePanelCard();
            col2.Margin = new Thickness(14, 0, 14, 0);
            Grid s2 = new Grid();
            s2.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            s2.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            s2.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            s2.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            s2.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

            UIElement sec2Header = CreateSectionHeader("2. NÓI VÀO MIC & CONFIRM KẾT QUẢ CUỐI", ColYuzu);
            Grid.SetRow(sec2Header, 0);
            s2.Children.Add(sec2Header);

            Button micBtn = new Button
            {
                Content = "🎙  ẤN ĐỂ NÓI VÀO MIC (Bật Mic Tiếng Việt)",
                Background = new SolidColorBrush(ColYuzu),
                Foreground = Brushes.White,
                BorderThickness = new Thickness(0),
                Padding = new Thickness(16, 13, 16, 13),
                FontSize = 14,
                FontWeight = FontWeights.Bold,
                Cursor = Cursors.Hand,
                Margin = new Thickness(0, 0, 0, 10)
            };
            micBtn.Click += delegate
            {
                _voiceInputBox.Focus();
                _voiceInputBox.SelectAll();
                CapyHubEngine.TriggerWindowsVoiceTyping();
                if (_statusLogLabel != null)
                    _statusLogLabel.Text = "🎙 Đang nghe Mic tiếng Việt... Hãy nói yêu cầu!";
            };
            Grid.SetRow(micBtn, 1);
            s2.Children.Add(micBtn);

            _voiceInputBox = new TextBox
            {
                Text = _currentMode.DefaultVoiceSample,
                Background = new SolidColorBrush(ColBgInput),
                Foreground = new SolidColorBrush(ColTextMain),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1.2),
                Padding = new Thickness(12, 10, 12, 10),
                FontSize = 13,
                Height = 76,
                TextWrapping = TextWrapping.Wrap,
                AcceptsReturn = true
            };
            _voiceInputBox.TextChanged += delegate { RefreshBlueprintPreview(); };
            Grid.SetRow(_voiceInputBox, 2);
            s2.Children.Add(_voiceInputBox);

            Border previewCard = new Border
            {
                Background = new SolidColorBrush(ColBgCard),
                BorderBrush = new SolidColorBrush(ColMatcha),
                BorderThickness = new Thickness(1.5),
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(16, 14, 16, 14),
                Margin = new Thickness(0, 12, 0, 12)
            };
            StackPanel previewSp = new StackPanel();
            _blueprintHeaderLabel = new TextBlock
            {
                Text = "👁 HÌNH DUNG KẾT QUẢ CUỐI (Bản Confirm #1):",
                Foreground = new SolidColorBrush(ColMatcha),
                FontSize = 13,
                FontWeight = FontWeights.Bold,
                Margin = new Thickness(0, 0, 0, 8)
            };
            previewSp.Children.Add(_blueprintHeaderLabel);

            _blueprintPreviewBox = new TextBlock
            {
                Foreground = new SolidColorBrush(ColTextMain),
                FontSize = 12.8,
                LineHeight = 22,
                TextWrapping = TextWrapping.Wrap
            };
            previewSp.Children.Add(_blueprintPreviewBox);
            previewCard.Child = previewSp;
            Grid.SetRow(previewCard, 3);
            s2.Children.Add(previewCard);

            Grid actionRow = new Grid();
            actionRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            actionRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1.2, GridUnitType.Star) });

            Button refineBtn = new Button
            {
                Content = "🔄 Chưa Đạt — Phân Tích Lại",
                Background = new SolidColorBrush(ColBgCard),
                Foreground = new SolidColorBrush(ColYuzu),
                BorderBrush = new SolidColorBrush(ColYuzu),
                BorderThickness = new Thickness(1.5),
                Padding = new Thickness(12, 13, 12, 13),
                FontSize = 13,
                FontWeight = FontWeights.Bold,
                Cursor = Cursors.Hand,
                Margin = new Thickness(0, 0, 6, 0)
            };
            refineBtn.Click += delegate { RunHarnessAction(false); };
            Grid.SetColumn(refineBtn, 0);
            actionRow.Children.Add(refineBtn);

            Button approveBtn = new Button
            {
                Content = "✅ ĐỒNG Ý — CHẠY & QA",
                Background = new SolidColorBrush(ColMatcha),
                Foreground = Brushes.White,
                BorderThickness = new Thickness(0),
                Padding = new Thickness(12, 13, 12, 13),
                FontSize = 13.5,
                FontWeight = FontWeights.Bold,
                Cursor = Cursors.Hand,
                Margin = new Thickness(6, 0, 0, 0)
            };
            approveBtn.Click += delegate { RunHarnessAction(true); };
            Grid.SetColumn(approveBtn, 1);
            actionRow.Children.Add(approveBtn);

            Grid.SetRow(actionRow, 4);
            s2.Children.Add(actionRow);

            col2.Child = s2;
            Grid.SetColumn(col2, 1);
            g.Children.Add(col2);

            // ==================== COLUMN 3: 3. AGENT & TRÍ NHỚ ====================
            Border col3 = CreatePanelCard();
            StackPanel s3 = new StackPanel();
            s3.Children.Add(CreateSectionHeader("3. AI AGENT & CÁ NHÂN HÓA", ColSky));

            WrapPanel cliRow = new WrapPanel { Margin = new Thickness(0, 0, 0, 12) };
            string[][] clis = new string[][]
            {
                new string[] { "agy", "Antigravity" },
                new string[] { "claude", "Claude" },
                new string[] { "codex", "Codex" }
            };
            foreach (string[] c in clis)
            {
                string cid = c[0];
                Border pill = new Border
                {
                    Background = new SolidColorBrush(cid == _selectedCli ? Color.FromRgb(20, 56, 42) : ColBgCard),
                    BorderBrush = new SolidColorBrush(cid == _selectedCli ? ColMatcha : ColBorder),
                    BorderThickness = new Thickness(1.5),
                    CornerRadius = new CornerRadius(8),
                    Padding = new Thickness(11, 6, 11, 6),
                    Margin = new Thickness(0, 0, 6, 6),
                    Cursor = Cursors.Hand
                };
                pill.Child = new TextBlock
                {
                    Text = c[1],
                    Foreground = new SolidColorBrush(ColTextMain),
                    FontSize = 11.5,
                    FontWeight = FontWeights.SemiBold
                };
                pill.MouseLeftButtonUp += delegate { SelectCli(cid); };
                _cliPills[cid] = pill;
                cliRow.Children.Add(pill);
            }
            s3.Children.Add(cliRow);

            Border memCard = new Border
            {
                Background = new SolidColorBrush(ColBgCard),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(14, 12, 14, 12),
                Margin = new Thickness(0, 0, 0, 12)
            };
            StackPanel memSp = new StackPanel();
            memSp.Children.Add(new TextBlock
            {
                Text = "🧠 Trí Nhớ Dài Hạn Cá Nhân",
                Foreground = new SolidColorBrush(ColYuzu),
                FontSize = 13,
                FontWeight = FontWeights.Bold,
                Margin = new Thickness(0, 0, 0, 4)
            });
            memSp.Children.Add(new TextBlock
            {
                Text = "Tự nhớ văn phong WPS, từ điển giọng nói & cách trình bày của bạn.",
                Foreground = new SolidColorBrush(ColTextSub),
                FontSize = 11.5,
                TextWrapping = TextWrapping.Wrap
            });
            Button editDnaBtn = CreateFlatButton("✏ Sửa Gu Cá Nhân (STYLE-DNA)", ColBgPanel, ColTextMain);
            editDnaBtn.Margin = new Thickness(0, 8, 0, 0);
            editDnaBtn.Click += delegate { OpenFileInEditor("03_HoSo_TriNho_CaNhan\\USER-STYLE-DNA.template.md"); };
            memSp.Children.Add(editDnaBtn);
            memCard.Child = memSp;
            s3.Children.Add(memCard);

            Border qaCard = new Border
            {
                Background = new SolidColorBrush(ColBgCard),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(14, 12, 14, 12),
                Margin = new Thickness(0, 0, 0, 12)
            };
            StackPanel qaSp = new StackPanel();
            qaSp.Children.Add(new TextBlock
            {
                Text = "🔍 File Bàn Giao & QA Liên Tục",
                Foreground = new SolidColorBrush(ColMatcha),
                FontSize = 13,
                FontWeight = FontWeights.Bold,
                Margin = new Thickness(0, 0, 0, 4)
            });
            qaSp.Children.Add(new TextBlock
            {
                Text = "Inspector Capy kiểm tra từng TASK-XX_HANDOFF.md đạt mới mở task sau.",
                Foreground = new SolidColorBrush(ColTextSub),
                FontSize = 11.5,
                TextWrapping = TextWrapping.Wrap
            });
            Button viewHandoffBtn = CreateFlatButton("📄 Xem File Bàn Giao QA", ColBgPanel, ColTextMain);
            viewHandoffBtn.Margin = new Thickness(0, 8, 0, 0);
            viewHandoffBtn.Click += delegate { OpenFileInEditor("04_BanGiao_SubAgents\\CURRENT-BLUEPRINT.md"); };
            qaSp.Children.Add(viewHandoffBtn);
            qaCard.Child = qaSp;
            s3.Children.Add(qaCard);

            _statusLogLabel = new TextBlock
            {
                Text = "✔ Sẵn sàng! Chọn việc -> Nói Mic -> Duyệt Confirm.",
                Foreground = new SolidColorBrush(ColMatcha),
                FontSize = 11.5,
                TextWrapping = TextWrapping.Wrap
            };
            s3.Children.Add(_statusLogLabel);

            col3.Child = s3;
            Grid.SetColumn(col3, 2);
            g.Children.Add(col3);

            return g;
        }

        private void SelectMode(CapyWorkMode mode, bool resetVoiceSample)
        {
            foreach (CapyModeInfo m in _modes)
            {
                if (m.Mode == mode) _currentMode = m;
            }

            foreach (KeyValuePair<CapyWorkMode, Border> kv in _modeCards)
            {
                bool active = kv.Key == mode;
                kv.Value.Background = new SolidColorBrush(active ? Color.FromRgb(48, 34, 24) : ColBgCard);
                kv.Value.BorderBrush = new SolidColorBrush(active ? ColYuzu : ColBorder);
            }

            if (resetVoiceSample && _voiceInputBox != null)
            {
                _blueprintRevision = 1;
                _voiceInputBox.Text = _currentMode.DefaultVoiceSample;
            }
            RefreshBlueprintPreview();
        }

        private void SelectCli(string cliId)
        {
            _selectedCli = cliId;
            foreach (KeyValuePair<string, Border> kv in _cliPills)
            {
                bool active = kv.Key == cliId;
                kv.Value.Background = new SolidColorBrush(active ? Color.FromRgb(20, 56, 42) : ColBgCard);
                kv.Value.BorderBrush = new SolidColorBrush(active ? ColMatcha : ColBorder);
            }
        }

        private void RefreshBlueprintPreview()
        {
            if (_blueprintPreviewBox == null || _currentMode == null) return;
            string clean = CapyHubEngine.NormalizeVoiceText(_voiceInputBox != null ? _voiceInputBox.Text : "");

            _blueprintHeaderLabel.Text = "👁 HÌNH DUNG KẾT QUẢ CUỐI (Bản Confirm #" + _blueprintRevision + "):";
            StringBuilder sb = new StringBuilder();
            sb.AppendLine("• Yêu cầu đã hiểu: \"" + clean + "\"");
            foreach (string line in _currentMode.PreviewDeliverables)
            {
                sb.AppendLine(line);
            }
            sb.Append("• Luồng chạy: Boss Capy -> " + _currentMode.SubagentName + " -> Inspector Capy (QA PASS)");
            _blueprintPreviewBox.Text = sb.ToString();
        }

        private void RunHarnessAction(bool isApprovedToExecute)
        {
            if (!isApprovedToExecute)
            {
                _blueprintRevision++;
            }
            RefreshBlueprintPreview();

            string workDir = _workDirBox != null && !string.IsNullOrWhiteSpace(_workDirBox.Text)
                ? _workDirBox.Text.Trim()
                : _hubRoot;

            CapyHubEngine.WriteBlueprintAndTaskFiles(
                _hubRoot,
                workDir,
                _currentMode,
                _voiceInputBox.Text,
                _blueprintRevision,
                isApprovedToExecute);

            if (!isApprovedToExecute)
            {
                _statusLogLabel.Text = "🔄 Đang phân tích lại Kết Quả Cuối (Lần #" + _blueprintRevision + ")...";
            }
            else
            {
                _statusLogLabel.Text = "✅ Đã duyệt! Đang giao " + _currentMode.SubagentName + " & QA liên tục!";
            }

            CapyHubEngine.LaunchCliAgent(_selectedCli, _hubRoot, isApprovedToExecute);
        }

        public void SwitchPage(int index)
        {
            bool isControl = index == 0;
            _controlPageGrid.Visibility = isControl ? Visibility.Visible : Visibility.Collapsed;
            _workflowPage.Visibility = isControl ? Visibility.Collapsed : Visibility.Visible;

            _tabControlBtn.Background = new SolidColorBrush(isControl ? ColYuzu : ColBgCard);
            _tabControlText.Foreground = new SolidColorBrush(isControl ? Colors.White : ColTextMain);

            _tabWorkflowBtn.Background = new SolidColorBrush(!isControl ? ColYuzu : ColBgCard);
            _tabWorkflowText.Foreground = new SolidColorBrush(!isControl ? Colors.White : ColTextMain);
        }

        private void OpenFileInEditor(string relPath)
        {
            string full = System.IO.Path.Combine(_hubRoot, relPath);
            if (File.Exists(full))
            {
                Process.Start(new ProcessStartInfo { FileName = "notepad.exe", Arguments = "\"" + full + "\"", UseShellExecute = true });
            }
        }

        private void OnWindowDrop(object sender, DragEventArgs e)
        {
            if (e.Data.GetDataPresent(DataFormats.FileDrop))
            {
                string[] files = (string[])e.Data.GetData(DataFormats.FileDrop);
                if (files != null && files.Length > 0)
                {
                    _workDirBox.Text = files[0];
                    _statusLogLabel.Text = "📂 Đã nhận: " + files[0];
                }
            }
        }

        private static Border CreatePanelCard()
        {
            return new Border
            {
                Background = new SolidColorBrush(ColBgPanel),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(14),
                Padding = new Thickness(16)
            };
        }

        private static TextBlock CreateSectionHeader(string title, Color color)
        {
            return new TextBlock
            {
                Text = title,
                Foreground = new SolidColorBrush(color),
                FontSize = 12,
                FontWeight = FontWeights.Bold,
                Margin = new Thickness(0, 0, 0, 12)
            };
        }

        private static Border CreateNavTab(string text, bool active, out TextBlock label)
        {
            Border b = new Border
            {
                Background = new SolidColorBrush(active ? ColYuzu : ColBgCard),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(14, 8, 14, 8),
                Cursor = Cursors.Hand
            };
            label = new TextBlock
            {
                Text = text,
                Foreground = new SolidColorBrush(active ? Colors.White : ColTextMain),
                FontSize = 12.5,
                FontWeight = FontWeights.Bold
            };
            b.Child = label;
            return b;
        }

        private static Button CreateFlatButton(string text, Color bg, Color fg)
        {
            return new Button
            {
                Content = text,
                Background = new SolidColorBrush(bg),
                Foreground = new SolidColorBrush(fg),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1),
                Padding = new Thickness(10, 7, 10, 7),
                FontSize = 11.5,
                FontWeight = FontWeights.SemiBold,
                Cursor = Cursors.Hand
            };
        }

        private static FrameworkElement CreateCapybaraAvatarBadge()
        {
            Border badge = new Border
            {
                Width = 42,
                Height = 42,
                CornerRadius = new CornerRadius(12),
                Background = new SolidColorBrush(Color.FromRgb(38, 28, 22)),
                BorderBrush = new SolidColorBrush(ColYuzu),
                BorderThickness = new Thickness(2)
            };

            Canvas cv = new Canvas { Width = 36, Height = 36 };
            Ellipse yuzu = new Ellipse { Width = 10, Height = 9, Fill = new SolidColorBrush(Color.FromRgb(255, 175, 36)) };
            Canvas.SetLeft(yuzu, 13);
            Canvas.SetTop(yuzu, 4);
            cv.Children.Add(yuzu);

            Rectangle head = new Rectangle
            {
                Width = 22,
                Height = 18,
                RadiusX = 8,
                RadiusY = 8,
                Fill = new SolidColorBrush(Color.FromRgb(186, 126, 78))
            };
            Canvas.SetLeft(head, 7);
            Canvas.SetTop(head, 12);
            cv.Children.Add(head);

            Rectangle snout = new Rectangle
            {
                Width = 12,
                Height = 10,
                RadiusX = 4,
                RadiusY = 4,
                Fill = new SolidColorBrush(Color.FromRgb(126, 76, 44))
            };
            Canvas.SetLeft(snout, 12);
            Canvas.SetTop(snout, 18);
            cv.Children.Add(snout);

            badge.Child = cv;
            return badge;
        }
    }
}
