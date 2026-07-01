import React from 'react';
import { Style, StageType, User } from '../types';
import { Sparkles, Send, Bot, User as UserIcon, Loader2, ArrowRight, Save, ClipboardList, CheckCircle2, RefreshCw, MessageSquare, Plus, FileText, AlertTriangle } from 'lucide-react';

interface GarmentAIProps {
  styles: Style[];
  currentUser: User;
  onAddStyle: (newStyle: Omit<Style, 'id' | 'stages'> & { stages: { stageType: StageType; deadlineDays: number }[] }) => void;
  onNavigateToStyles: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  styleIdContext?: string;
}

interface GeneratedStage {
  stageType: StageType;
  deadlineDays: number;
  note: string;
}

interface GeneratedSpec {
  styleCode: string;
  customer: string;
  season: string;
  buyer: string;
  factory: string;
  stages: GeneratedStage[];
  notes?: string;
}

export default function GarmentAI({ styles, currentUser, onAddStyle, onNavigateToStyles }: GarmentAIProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<'chat' | 'spec_generator'>('chat');
  
  // Chat state
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Xin chào **${currentUser.name.split(' (')[0]}**! Tôi là **GarmentAI** - Trợ lý AI chuyên môn về phát triển mẫu may mặc.

Tôi có thể hỗ trợ bạn:
1. **Phân tích rủi ro trễ tiến độ** của các mã hàng hiện tại và đề xuất giải pháp.
2. **Duyệt mẫu & viết Fit Comments** chuẩn kỹ thuật.
3. **Lập danh sách QC Checklist** kiểm soát chất lượng mẫu may.
4. **Dịch và chuẩn hóa thuật ngữ chuyên ngành** Việt - Anh.

*Hãy chọn một mã hàng bên dưới để thảo luận trực tiếp trên bối cảnh dữ liệu đó!*`,
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = React.useState('');
  const [selectedStyleId, setSelectedStyleId] = React.useState<string>('none');
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Spec generator state
  const [specPrompt, setSpecPrompt] = React.useState('');
  const [isGeneratingSpec, setIsGeneratingSpec] = React.useState(false);
  const [generatedSpec, setGeneratedSpec] = React.useState<GeneratedSpec | null>(null);
  const [editableStyleCode, setEditableStyleCode] = React.useState('');
  const [specError, setSpecError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Scroll to bottom of chat
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // Format markdown helper to render rich texts without external libs
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-slate-800 mt-3 mb-1.5">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-black text-slate-900 mt-4 mb-2">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-black text-slate-900 mt-5 mb-2.5">{line.replace('# ', '')}</h2>;
      }
      
      // Unordered lists
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 text-xs leading-relaxed my-0.5">
            {parseInlineFormatting(content)}
          </li>
        );
      }

      // Ordered lists
      const numberedListRegex = /^\d+\.\s(.*)/;
      if (numberedListRegex.test(line)) {
        const content = line.replace(/^\d+\.\s/, '');
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-700 text-xs leading-relaxed my-0.5">
            {parseInlineFormatting(content)}
          </li>
        );
      }

      return (
        <p key={idx} className="text-slate-700 text-xs leading-relaxed my-1 min-h-[1px]">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  const parseInlineFormatting = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const codeRegex = /`(.*?)`/g;
    
    // Simple parser for **bold** and `code` inline elements
    let parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    // We will do a manual split-parse or a combined replacement
    const elements: { index: number; length: number; node: React.ReactNode }[] = [];
    
    // Find bold matches
    while ((match = boldRegex.exec(text)) !== null) {
      elements.push({
        index: match.index,
        length: match[0].length,
        node: <strong key={`b-${match.index}`} className="font-bold text-slate-950">{match[1]}</strong>
      });
    }
    
    // Find code matches
    while ((match = codeRegex.exec(text)) !== null) {
      elements.push({
        index: match.index,
        length: match[0].length,
        node: <code key={`c-${match.index}`} className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono font-medium text-blue-600">{match[1]}</code>
      });
    }
    
    // Sort elements by index
    elements.sort((a, b) => a.index - b.index);
    
    // Build react parts
    let currentIndex = 0;
    for (const el of elements) {
      if (el.index < currentIndex) continue; // Skip overlapping (e.g. inside other matches)
      if (el.index > currentIndex) {
        parts.push(text.substring(currentIndex, el.index));
      }
      parts.push(el.node);
      currentIndex = el.index + el.length;
    }
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  // Quick prompt presets
  const handleQuickPrompt = (promptText: string) => {
    if (isChatLoading) return;
    setChatInput(promptText);
    sendMessage(promptText);
  };

  // Send message to Express API
  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
      styleIdContext: selectedStyleId !== 'none' ? selectedStyleId : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setChatInput('');
    setIsChatLoading(true);

    try {
      // Construct context from selected style
      let contextString = "";
      if (selectedStyleId !== 'none') {
        const style = styles.find(s => s.id === selectedStyleId);
        if (style) {
          contextString = `DỮ LIỆU BỐI CẢNH MÃ HÀNG HIỆN TẠI:
- Mã hàng (Style Code): ${style.styleCode}
- Khách hàng (Customer): ${style.customer}
- Mùa hàng (Season): ${style.season}
- Người mua (Buyer): ${style.buyer}
- Xưởng/Nhà máy (Factory): ${style.factory}
- Trạng thái tổng quan: ${style.status}
- Danh sách các giai đoạn phát triển mẫu hiện tại:
${style.stages.map(st => `  + Giai đoạn: ${st.stageType} | Deadline: ${st.deadline} | Trạng thái: ${st.status} | Tiến độ: ${st.progressPercent}% | Ghi chú: ${st.note || 'Không có'}`).join('\n')}
---
`;
        }
      }

      const systemPrompt = `Bạn là GarmentAI, một trợ lý chuyên gia phát triển mẫu và kỹ thuật ngành may mặc chuyên nghiệp.
Hãy trả lời câu hỏi của người dùng ngắn gọn, súc tích, mang tính thực tế cao trong quản lý mẫu phòng kỹ thuật (Sample room).
Sử dụng bối cảnh dữ liệu mã hàng được cung cấp (nếu có) để đưa ra câu trả lời cực kỳ chính xác.
Hãy định dạng câu trả lời bằng Markdown (in đậm, danh sách gạch đầu dòng, tiêu đề vừa phải) để giao diện dễ đọc. Tránh viết quá dài dòng không cần thiết.`;

      const promptPayload = contextString 
        ? `${contextString}\nCâu hỏi/Yêu cầu của người dùng: ${textToSend}`
        : textToSend;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptPayload,
          systemInstruction: systemPrompt
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi phản hồi từ máy chủ AI');
      }

      const data = await response.json();
      
      const botMsg: Message = {
        id: `msg-${Date.now()}-bot`,
        role: 'model',
        text: data.text || "Xin lỗi, tôi không nhận được phản hồi từ hệ thống.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: 'model',
        text: `⚠️ **Đã xảy ra lỗi kết nối với máy chủ AI:** ${error.message || 'Không rõ nguyên nhân'}. Vui lòng thử lại sau hoặc cấu hình đúng API Key trong Settings.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate complete style spec from descriptive text
  const generateStyleSpec = async () => {
    if (!specPrompt.trim() || isGeneratingSpec) return;
    
    setIsGeneratingSpec(true);
    setSpecError(null);
    setGeneratedSpec(null);
    setSaveSuccess(false);

    try {
      const responseSchema = {
        type: "OBJECT",
        properties: {
          styleCode: { type: "STRING", description: "Mã hàng tự động gợi ý, ví dụ: AI-JKT-101, AI-TSH-202" },
          customer: { type: "STRING", description: "Tên thương hiệu hoặc khách hàng" },
          season: { type: "STRING", description: "Mùa hàng thiết kế, ví dụ: Fall 2026, Summer 2026" },
          buyer: { type: "STRING", description: "Tên Buyer phụ trách" },
          factory: { type: "STRING", description: "Nhà máy sản xuất phù hợp" },
          stages: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                stageType: { 
                  type: "STRING", 
                  description: "Phải chọn chính xác một trong các giá trị: 'Proto Sample', 'Fit Sample', 'PP Sample', 'Size Set Sample', 'Sales Sample', 'TOP Sample', 'Final Approval', 'Production Ready'"
                },
                deadlineDays: { type: "INTEGER", description: "Số ngày kể từ ngày hôm nay để hoàn thành giai đoạn này, ví dụ: 5, 12, 20, v.v..." },
                note: { type: "STRING", description: "Ghi chú chuyên môn kỹ thuật hoặc tài liệu cần chuẩn bị cho giai đoạn này" }
              },
              required: ["stageType", "deadlineDays", "note"]
            },
            description: "Danh sách 4-6 giai đoạn may mẫu chuẩn xác tùy vào loại sản phẩm từ Proto đến Production Ready"
          },
          notes: { type: "STRING", description: "Tóm tắt phân tích kỹ thuật hoặc nhận xét chung của AI về sản phẩm" }
        },
        required: ["styleCode", "customer", "season", "buyer", "factory", "stages"]
      };

      const systemInstruction = `Bạn là Trợ lý AI chuyên phân tích tài liệu kỹ thuật ngành may.
Khi người dùng mô tả một mẫu thiết kế hoặc sản phẩm may mặc, hãy phân tích và gợi ý một hồ sơ mã hàng (Style Spec) hoàn chỉnh với:
1. Thông tin khách hàng, mùa hàng, người phụ trách, xưởng sản xuất phù hợp.
2. Thiết lập quy trình phát triển mẫu (các giai đoạn phát triển - stages) với số ngày hoàn thành (deadlineDays) và hướng dẫn kỹ thuật chi tiết cho từng giai đoạn.
Hãy trả về ĐÚNG cấu trúc JSON được yêu cầu để ứng dụng parse trực tiếp vào cơ sở dữ liệu.`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: specPrompt,
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema
        })
      });

      if (!response.ok) {
        throw new Error('Không thể kết nối với máy chủ AI để sinh dữ liệu cấu trúc.');
      }

      const data = await response.json();
      const spec: GeneratedSpec = JSON.parse(data.text);
      
      // Ensure we have stages
      if (!spec.stages || spec.stages.length === 0) {
        throw new Error("AI không tạo đủ thông tin giai đoạn mẫu.");
      }

      setGeneratedSpec(spec);
      setEditableStyleCode(spec.styleCode);
    } catch (err: any) {
      console.error("AI Spec Generator Error:", err);
      setSpecError(err.message || "Lỗi xử lý dữ liệu AI.");
    } finally {
      setIsGeneratingSpec(false);
    }
  };

  // Save generated spec to system
  const handleSaveGeneratedSpec = () => {
    if (!generatedSpec) return;

    // Filter stages that are valid stage types
    const validStageTypes: StageType[] = [
      'Proto Sample', 'Fit Sample', 'PP Sample', 'Size Set Sample', 'Sales Sample', 'TOP Sample', 'Final Approval', 'Production Ready'
    ];

    const mappedStages = generatedSpec.stages
      .filter(st => validStageTypes.includes(st.stageType))
      .map(st => ({
        stageType: st.stageType,
        deadlineDays: st.deadlineDays
      }));

    if (mappedStages.length === 0) {
      alert("Quy trình AI tạo ra không chứa giai đoạn mẫu hợp lệ. Không thể lưu.");
      return;
    }

    // Call app parent to save
    onAddStyle({
      styleCode: editableStyleCode || generatedSpec.styleCode,
      customer: generatedSpec.customer,
      season: generatedSpec.season,
      buyer: generatedSpec.buyer || 'Chưa cập nhật',
      factory: generatedSpec.factory || 'Tổ mẫu trung tâm',
      status: 'Active',
      createdBy: currentUser.name.split(' (')[0],
      createdAt: new Date().toISOString(),
      stages: mappedStages
    });

    setSaveSuccess(true);
    setTimeout(() => {
      onNavigateToStyles();
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] space-y-6" id="ai-workspace-root">
      {/* Premium Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg text-white shadow-md shadow-blue-500/10">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-slate-900 text-2xl flex items-center gap-1.5">GarmentAI Copilot</h1>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Trợ lý thiết kế, đề xuất quy trình và tối ưu hóa tiến độ may mẫu bằng Trí tuệ Nhân tạo.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tabs toggler */}
        <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-sans rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'chat'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Trợ lý AI hỏi đáp</span>
          </button>
          <button
            onClick={() => setActiveSubTab('spec_generator')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-sans rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'spec_generator'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tạo Mã hàng nhanh</span>
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {activeSubTab === 'chat' ? (
          /* CHAT MODULE */
          <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Left Chat view */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Context Selector Header */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></div>
                  <span className="text-xs font-bold text-slate-700 font-sans">Đang thảo luận trên:</span>
                </div>
                <select
                  id="ai-context-style-selector"
                  value={selectedStyleId}
                  onChange={(e) => setSelectedStyleId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg text-xs font-sans px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium max-w-xs cursor-pointer"
                >
                  <option value="none">✨ Câu hỏi kỹ thuật chung (Không có bối cảnh)</option>
                  {styles.map(s => (
                    <option key={s.id} value={s.id}>
                      📦 Mã hàng {s.styleCode} ({s.customer} - {s.season})
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Streams */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/40">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                    }`}>
                      {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl text-xs font-sans shadow-xs transition-all ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                      }`}>
                        {renderFormattedText(msg.text)}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.styleIdContext && (
                          <span className="ml-1.5 text-blue-500 font-bold uppercase">
                            · Bối cảnh: {styles.find(s => s.id === msg.styleIdContext)?.styleCode}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex gap-3 max-w-3xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 animate-spin">
                      <Loader2 className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none text-xs font-sans flex items-center gap-2 text-slate-500 shadow-xs">
                      <span>GarmentAI đang suy nghĩ và phân tích chuyên môn...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex gap-2 items-center"
                >
                  <input
                    type="text"
                    placeholder={
                      selectedStyleId !== 'none'
                        ? `Đặt câu hỏi về mã hàng ${styles.find(s => s.id === selectedStyleId)?.styleCode}...`
                        : "Hỏi đáp về kỹ thuật, tiến độ mẫu, comments, checklists..."
                    }
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatLoading}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans transition-all disabled:opacity-65"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all shadow-sm shrink-0 disabled:opacity-50 disabled:hover:bg-blue-600 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Quick Actions list */}
            <div className="w-full md:w-72 p-4 md:p-5 bg-slate-50/50 shrink-0 overflow-y-auto space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5 mb-2">
                <ClipboardList className="w-4 h-4 text-slate-500" />
                <span>Mẫu ý kiến gợi ý</span>
              </h3>
              
              <div className="space-y-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xs transition-all text-left">
                  <h4 className="text-[11px] font-bold text-slate-800 font-sans">📊 Phân tích rủi ro & Tiến độ</h4>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5 mb-2">Phát hiện trễ deadline phòng kỹ thuật và gợi ý phương án dự phòng.</p>
                  <button
                    onClick={() => {
                      if (selectedStyleId === 'none') {
                        // Select the first style automatically as default context
                        if (styles.length > 0) setSelectedStyleId(styles[0].id);
                      }
                      handleQuickPrompt("Phân tích rủi ro chậm deadline các giai đoạn và đề xuất kế hoạch hành động khắc phục.");
                    }}
                    className="w-full bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 font-sans font-bold text-[10px] py-1 px-2.5 rounded-lg transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Yêu cầu Phân tích</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xs transition-all text-left">
                  <h4 className="text-[11px] font-bold text-slate-800 font-sans">💬 Tạo Tài liệu Fit Comments</h4>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5 mb-2">Tạo biểu mẫu nhận xét kỹ thuật duyệt mẫu chuyên nghiệp chuyển giao Pattern.</p>
                  <button
                    onClick={() => {
                      handleQuickPrompt("Hãy soạn thảo một văn bản Fit Comments (nhận xét duyệt mẫu) chuẩn kỹ thuật cho một sản phẩm áo thun polo bị lỗi rộng ngực và ngắn tay.");
                    }}
                    className="w-full bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 font-sans font-bold text-[10px] py-1 px-2.5 rounded-lg transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Tạo Fit Comments</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xs transition-all text-left">
                  <h4 className="text-[11px] font-bold text-slate-800 font-sans">🔍 Lập QC Checklist sản phẩm</h4>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5 mb-2">Thiết lập các tiêu chuẩn kiểm hóa phòng may mẫu trước khi gửi Buyer.</p>
                  <button
                    onClick={() => {
                      handleQuickPrompt("Hãy lập danh sách QC Checklist kiểm tra chất lượng chi tiết trước xuất xưởng cho sản phẩm Áo khoác gió bomber 2 lớp.");
                    }}
                    className="w-full bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 font-sans font-bold text-[10px] py-1 px-2.5 rounded-lg transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Tạo QC Checklist</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xs transition-all text-left">
                  <h4 className="text-[11px] font-bold text-slate-800 font-sans">🇬🇧 Dịch Kỹ thuật (Việt - Anh)</h4>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5 mb-2">Chuẩn hóa các thuật ngữ may như diễu cổ, may chập, đường can vai sang tiếng Anh kỹ thuật.</p>
                  <button
                    onClick={() => {
                      handleQuickPrompt("Hãy dịch các thuật ngữ may mặc sau sang tiếng Anh kỹ thuật ngành may: 'diễu sườn 0.5cm', 'tra cổ bọc chân', 'can chập sườn', 'bo chun gấu tay', 'ép keo mếch cổ áo'.");
                    }}
                    className="w-full bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 font-sans font-bold text-[10px] py-1 px-2.5 rounded-lg transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Dịch Thuật Ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SPEC GENERATOR MODULE */
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Prompt Input left */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 font-display uppercase tracking-widest">Mô tả sản phẩm</h3>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                    Nhập ý tưởng hoặc mô tả chi tiết của sản phẩm để AI tự động lên quy trình may mẫu, đề xuất Buyer, nhà máy và mốc thời gian hoàn tất.
                  </p>
                </div>
                
                <textarea
                  id="ai-spec-desc-input"
                  rows={6}
                  placeholder="Ví dụ: Áo khoác gió thể thao nam 2 lớp chống gió nước, bo gấu co giãn, dây kéo khóa đồng, thiết kế cho khách hàng Uniqlo mùa Thu Đông 2026. Phù hợp xưởng dệt kim..."
                  value={specPrompt}
                  onChange={(e) => setSpecPrompt(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed resize-none"
                />

                <button
                  onClick={generateStyleSpec}
                  disabled={isGeneratingSpec || !specPrompt.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-sans text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isGeneratingSpec ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>GarmentAI đang tạo quy trình mẫu...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tạo Hồ Sơ Mã Hàng Bằng AI</span>
                    </>
                  )}
                </button>

                {specError && (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-2 text-[10px] text-red-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span>Lỗi AI: {specError}</span>
                  </div>
                )}
              </div>

              {/* Output Preview right */}
              <div className="lg:col-span-7 space-y-4">
                {generatedSpec ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Gợi ý từ GarmentAI</span>
                        <h3 className="text-sm font-bold text-slate-950 mt-1 font-display">Chi tiết hồ sơ sản phẩm đề xuất</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-500">Mã hàng:</label>
                        <input
                          type="text"
                          value={editableStyleCode}
                          onChange={(e) => setEditableStyleCode(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Metadata grids */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-3.5 rounded-lg text-xs font-sans">
                      <div>
                        <span className="text-slate-400 font-medium block">Khách hàng:</span>
                        <strong className="text-slate-900 font-bold mt-0.5 block">{generatedSpec.customer}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Mùa hàng:</span>
                        <strong className="text-slate-900 font-bold mt-0.5 block">{generatedSpec.season}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Buyer:</span>
                        <strong className="text-slate-900 font-bold mt-0.5 block">{generatedSpec.buyer}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Nhà máy sản xuất:</span>
                        <strong className="text-slate-900 font-bold mt-0.5 block">{generatedSpec.factory}</strong>
                      </div>
                    </div>

                    {/* Stage lists */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">Quy trình May Mẫu đề xuất:</h4>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                        {generatedSpec.stages.map((stage, sIdx) => (
                          <div key={sIdx} className="p-3 bg-white flex items-start justify-between gap-4 text-xs font-sans hover:bg-slate-50 transition-colors">
                            <div className="space-y-0.5 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{stage.stageType}</span>
                                <span className="bg-slate-100 text-[9px] font-mono font-bold text-slate-500 px-1.5 py-0.2 rounded">T+ {stage.deadlineDays} ngày</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed">{stage.note}</p>
                            </div>
                            <span className="bg-blue-50 text-blue-600 text-[9px] font-bold py-0.5 px-2 rounded-full border border-blue-100">
                              Deadline đề xuất
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {generatedSpec.notes && (
                      <div className="bg-indigo-50/50 border border-indigo-100/60 p-3.5 rounded-lg text-[11px] font-sans text-indigo-900">
                        <strong className="font-bold block mb-1">💡 Đánh giá kỹ thuật chuyên sâu:</strong>
                        <p className="leading-relaxed text-slate-700">{generatedSpec.notes}</p>
                      </div>
                    )}

                    {/* Action button */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setGeneratedSpec(null);
                          setSpecPrompt('');
                        }}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-sans font-bold text-xs py-2 px-4 rounded-lg transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSaveGeneratedSpec}
                        disabled={saveSuccess}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs py-2 px-4.5 rounded-lg shadow-sm shadow-blue-500/10 transition-all cursor-pointer disabled:bg-green-600 disabled:shadow-none"
                      >
                        {saveSuccess ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            <span>Đã Lưu Thành Công! Đang chuyển hướng...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Đồng Ý & Thêm Vào Hệ Thống</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/20">
                    <Sparkles className="w-8 h-8 text-slate-300 animate-pulse mb-3" />
                    <p className="text-xs font-bold text-slate-500 font-sans">Bảng xem trước Hồ sơ sản phẩm AI</p>
                    <p className="text-[10px] text-slate-400 font-sans max-w-sm mt-1">
                      Sau khi nhập mô tả thiết kế ở cột bên trái và bấm nút phân tích, thông số sản phẩm mẫu chuẩn hóa và các mốc quy trình sẽ hiển thị ở đây để duyệt.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
