import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { ADD_CONTENT_TO_LESSON_TOOL_NAME } from './toolNames';

export const addContentToLessonToolDefinition: ChatCompletionTool = {
    type: "function",
    function: {
        name: ADD_CONTENT_TO_LESSON_TOOL_NAME,
        description: "Thêm nội dung chi tiết vào một bài học. AI sẽ tự tạo ra nội dung text/markdown và cung cấp URL nếu có nội dung đa phương tiện, hoặc tạo cấu trúc bài tập.",
        parameters: {
            type: "object",
            properties: {
                lesson_id: {
                    type: "string",
                    description: "ID của bài học.",
                },
                content_type: {
                    type: "string",
                    description: "Loại nội dung. Ví dụ: 'text', 'markdown', 'image_url', 'exercise'.",
                    enum: ["text", "markdown", "code_example", "image_url", "audio_url", "video_url", "exercise"],
                },
                content_data: {
                    type: "object",
                    description: "Một dictionary chứa dữ liệu cụ thể của nội dung. Cấu trúc tùy thuộc vào content_type. Ví dụ: {'text': '...'} cho 'text'; {'url': '...', 'caption': '...'} cho 'image_url'; {'exercise_type': 'multiple_choice', 'question': '...', 'options': [...], 'correct_answer': '...'} cho 'exercise'. AI sẽ tự tạo ra các trường cần thiết cho content_data dựa trên content_type.",
                    // Để linh hoạt, chúng ta không định nghĩa properties cụ thể cho content_data ở đây,
                    // vì nó thay đổi quá nhiều. AI sẽ phải tự suy luận cấu trúc dựa trên content_type và mô tả.
                    // Nếu muốn chặt chẽ hơn, có thể dùng oneOf với các schema khác nhau cho mỗi content_type.
                },
            },
            required: ["lesson_id", "content_type", "content_data"],
        },
    },
};

export interface AddContentToLessonArgs {
    lesson_id: string;
    content_type: "text" | "markdown" | "code_example" | "image_url" | "audio_url" | "video_url" | "exercise";
    content_data: { [key: string]: any }; // Dùng any ở đây vì cấu trúc rất đa dạng
}

export function addContentToLessonImplementation(args: AddContentToLessonArgs): string {
    console.log(`[Tool Mock: ${ADD_CONTENT_TO_LESSON_TOOL_NAME}] Adding content (type: ${args.content_type}) to lesson ${args.lesson_id}`);
    console.log(`[Tool Mock: ${ADD_CONTENT_TO_LESSON_TOOL_NAME}] Content data:`, JSON.stringify(args.content_data, null, 2));
    // Mock backend call
    const content_block_id = `content_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Tool Mock: ${ADD_CONTENT_TO_LESSON_TOOL_NAME}] Generated content_block_id: ${content_block_id} (or simply success status)`);
    return JSON.stringify({
        status: "success",
        message: `Content (type: ${args.content_type}) added to lesson ${args.lesson_id}.`,
        content_block_id: content_block_id // Optional
    });
}