import OpenAI from 'openai';
import {
    ChatCompletionMessageParam,
    ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
// --- CONFIGURATION ---
import { API_KEY, BASE_URL, MODEL_ID, MAX_ITERATIONS } from './config';

// --- SYSTEM PROMPT ---
import { systemPromptContent } from './system_prompt';

// --- TOOLS ---
import {
    allToolDefinitions,
    toolImplementations,
} from './tools';

// Khởi tạo OpenAI client
const openai = new OpenAI({
    baseURL: BASE_URL,
    apiKey: API_KEY,
});

let conversationHistory: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPromptContent }
];


async function handleSingleTurn(currentUserQuery?: string) {
    console.log("\n--------------------------------------------------");
    if (currentUserQuery) {
        console.log(`User: ${currentUserQuery}`);
        conversationHistory.push({ role: "user", content: currentUserQuery });
    } else if (conversationHistory.length === 1) { // Chỉ có system prompt
        // Trường hợp này không nên xảy ra nếu luôn có query ban đầu
        console.error("Lỗi: Không có query ban đầu từ người dùng.");
        return;
    }


    let currentIteration = 0;
    let continueConversationAfterToolCalls = true; // Cờ để biết có nên tiếp tục vòng lặp nếu có tool call

    // Tạo một bản copy messages cho lượt xử lý hiện tại để tránh thay đổi trực tiếp conversationHistory quá sớm
    // Hoặc có thể truyền trực tiếp conversationHistory và quản lý cẩn thận
    let messagesForThisTurn: ChatCompletionMessageParam[] = [...conversationHistory];

    try {
        while (currentIteration < MAX_ITERATIONS && continueConversationAfterToolCalls) {
            currentIteration++;
            console.log(`\n[Iteration ${currentIteration}/${MAX_ITERATIONS}] Calling model with ${messagesForThisTurn.length} messages in history...`);

            const stream = await openai.chat.completions.create({
                model: MODEL_ID,
                messages: messagesForThisTurn,
                tools: allToolDefinitions,
                tool_choice: "auto",
                stream: true,
            });

            let assistantResponseMessage = "";
            const currentToolCalls: ChatCompletionMessageToolCall[] = [];

            process.stdout.write("Assistant: ");
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;
                if (!delta) continue;

                if (delta.content) {
                    process.stdout.write(delta.content);
                    assistantResponseMessage += delta.content;
                }

                if (delta.tool_calls) {
                    // (Logic xử lý delta.tool_calls như cũ)
                    for (const toolCallDelta of delta.tool_calls) {
                        const index = toolCallDelta.index;
                        if (typeof index !== 'number') continue;

                        if (!currentToolCalls[index]) {
                            currentToolCalls[index] = {
                                id: toolCallDelta.id || "",
                                type: "function",
                                function: {
                                    name: toolCallDelta.function?.name || "",
                                    arguments: toolCallDelta.function?.arguments || ""
                                },
                            };
                        } else {
                            if (toolCallDelta.id && !currentToolCalls[index].id) currentToolCalls[index].id = toolCallDelta.id;
                            if (toolCallDelta.function?.name) currentToolCalls[index].function.name += toolCallDelta.function.name;
                            if (toolCallDelta.function?.arguments) currentToolCalls[index].function.arguments += toolCallDelta.function.arguments;
                        }
                    }
                }
            }
            process.stdout.write("\n");

            const validToolCalls = currentToolCalls.filter(tc => tc && tc.id && tc.function.name && tc.function.name.length > 0);

            const assistantMessage: ChatCompletionMessageParam = {
                role: "assistant",
                content: assistantResponseMessage.trim() || null,
            };
            if (validToolCalls.length > 0) {
                (assistantMessage as any).tool_calls = validToolCalls;
            }

            // Thêm phản hồi của assistant vào messagesForThisTurn và conversationHistory
            messagesForThisTurn.push(assistantMessage);
            // conversationHistory.push(assistantMessage); // Cập nhật lịch sử chính sau khi lượt hoàn tất

            if (validToolCalls.length === 0) {
                console.log("[Model] Responded with text. Awaiting next user input or ending turn.");
                continueConversationAfterToolCalls = false; // Dừng vòng lặp while cho lượt này
                // Lịch sử đã bao gồm câu trả lời text của assistant
                // conversationHistory sẽ được cập nhật cuối hàm handleSingleTurn
                break;
            }

            // Xử lý tool calls (Logic như cũ)
            console.log(`\n[ToolCall Processing] Detected ${validToolCalls.length} tool_call(s).`);
            for (const toolCall of validToolCalls) {
                console.log(`  [ToolCall] ID: ${toolCall.id}, Executing: ${toolCall.function.name}`);
                if (toolCall.function.arguments) {
                    console.log(`  [ToolCall] Arguments (raw): ${toolCall.function.arguments}`);
                }
                let toolResultContent: string;
                let args: any;
                try {
                    args = toolCall.function.arguments && toolCall.function.arguments.trim() !== "" ? JSON.parse(toolCall.function.arguments) : {};
                } catch (e) {
                    const errorMsg = e instanceof Error ? e.message : String(e);
                    console.error(`  [ToolCall] Error parsing arguments for ${toolCall.function.name}:`, errorMsg);
                    toolResultContent = `Lỗi khi phân tích đối số cho công cụ ${toolCall.function.name}: ${errorMsg}. Dữ liệu đối số nhận được: ${toolCall.function.arguments}`;
                    const toolMessage: ChatCompletionMessageParam = { role: "tool", tool_call_id: toolCall.id, content: toolResultContent };
                    messagesForThisTurn.push(toolMessage);
                    // conversationHistory.push(toolMessage);
                    continue;
                }

                const toolImplementation = toolImplementations[toolCall.function.name];
                if (toolImplementation) {
                    toolResultContent = toolImplementation(args);
                } else {
                    console.warn(`  [ToolCall] Received unhandled tool: ${toolCall.function.name}`);
                    toolResultContent = `Lỗi: Công cụ có tên '${toolCall.function.name}' không được hỗ trợ hoặc không được định nghĩa.`;
                }
                console.log(`  [ToolCall] Result: ${toolResultContent}`);
                const toolMessage: ChatCompletionMessageParam = { role: "tool", tool_call_id: toolCall.id, content: toolResultContent };
                messagesForThisTurn.push(toolMessage);
                // conversationHistory.push(toolMessage);
            } // Kết thúc for (tool calls)
            // Nếu có tool call, vòng lặp while sẽ tiếp tục để model xử lý kết quả tool
        } // Kết thúc while (iterations)

        if (currentIteration >= MAX_ITERATIONS &&
            messagesForThisTurn[messagesForThisTurn.length - 1]?.role === 'assistant' &&
            (messagesForThisTurn[messagesForThisTurn.length - 1] as any)?.tool_calls?.length) {
            console.warn(`\n[Warning] Đã đạt đến số lần lặp tối đa (${MAX_ITERATIONS}) và phản hồi cuối cùng của model vẫn là một yêu cầu tool call. Model sẽ được yêu cầu tổng hợp.`);
            const userFeedbackMessage: ChatCompletionMessageParam = {
                role: "user",
                content: "Đã đạt giới hạn số lần gọi công cụ. Vui lòng tổng hợp kết quả hiện tại và trả lời người dùng."
            };
            messagesForThisTurn.push(userFeedbackMessage);
            // conversationHistory.push(userFeedbackMessage);
            // Có thể gọi model lần cuối ở đây để tổng hợp, hoặc để lượt tiếp theo xử lý
        }

        // SAU KHI LƯỢT HIỆN TẠI KẾT THÚC (model trả lời text, hoặc hết MAX_ITERATIONS)
        // Cập nhật conversationHistory chính bằng messagesForThisTurn
        // Chỉ lấy những message mới được thêm trong lượt này
        const newMessagesFromThisTurn = messagesForThisTurn.slice(conversationHistory.length - (currentUserQuery ? 1 : 0) ); // -1 nếu có currentUserQuery
        if (currentUserQuery) { // Nếu lượt này bắt đầu bằng một user query mới
            conversationHistory.push(...newMessagesFromThisTurn);
        } else { // Nếu lượt này là model tự chạy tiếp (ví dụ sau tool call) mà không có user input mới
            // Cẩn thận: Logic này cần được xem lại.
            // Ý tưởng là messagesForThisTurn chứa toàn bộ lịch sử + tin nhắn mới.
            // Ta chỉ cần cập nhật conversationHistory bằng messagesForThisTurn.
            conversationHistory = [...messagesForThisTurn];
        }


    } catch (error) {
        // ... (Error handling như cũ) ...
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("\n[Error] Đã xảy ra lỗi:", errorMessage);
        if (error instanceof OpenAI.APIError) {
            console.error("Chi tiết lỗi API:", { status: error.status, /* ... */ });
        }
    } finally {
        console.log("\n--- Lịch sử hội thoại hiện tại ---");
        conversationHistory.forEach((msg, index) => {
            // ... (log message như cũ) ...
            const contentStr = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
            let contentLog = contentStr ? `Content: "${contentStr.substring(0, 100)}${contentStr.length > 100 ? '...' : ''}"` : "Content: N/A";
            let toolCallsLog = (msg.role === 'assistant' && (msg as any).tool_calls) ? `ToolCalls: ${JSON.stringify((msg as any).tool_calls)}` : "ToolCalls: N/A";
            console.log(`[Message ${index + 1}] Role: ${msg.role}, ${contentLog}, ${toolCallsLog}`);
        });
    }
}


async function chatLoop() {
    const rl = readline.createInterface({ input, output });
    console.log("Chào bạn, tôi là trợ lý AI. Bạn muốn tôi giúp gì nào? (gõ 'quit' để thoát)");

    // Lượt đầu tiên có thể có một query mặc định hoặc chờ người dùng nhập
    // let initialUserQuery = "Thời tiết Hà Nội hôm nay thế nào?";
    // await handleSingleTurn(initialUserQuery);
    // Hoặc để trống và để người dùng nhập ngay từ đầu

    while (true) {
        const userInput = await rl.question("You: ");
        if (userInput.toLowerCase() === 'quit') {
            break;
        }
        if (userInput.trim() === "") {
            continue;
        }
        await handleSingleTurn(userInput);
    }
    rl.close();
    console.log("--- Kết thúc hội thoại ---");
}

// --- EXECUTION ---
async function main() {
    // Ví dụ: bắt đầu với một câu hỏi cụ thể
    // const initialQuery = "Kể cho tôi một câu chuyện cười.";
    // conversationHistory.push({ role: "user", content: initialQuery });
    // await handleSingleTurn(); // Gọi handleSingleTurn không có tham số để nó dùng query cuối cùng trong history

    // Hoặc bắt đầu vòng lặp chat ngay
    await chatLoop();

    console.log(`\nSử dụng Model: ${MODEL_ID}`);
}

main().catch(console.error);