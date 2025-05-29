import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { ADD_LESSON_TO_MODULE_TOOL_NAME } from './toolNames';

export const addLessonToModuleToolDefinition: ChatCompletionTool = {
    type: "function",
    function: {
        name: ADD_LESSON_TO_MODULE_TOOL_NAME,
        description: "Thêm một bài học (đơn vị nhỏ hơn) vào module.",
        parameters: {
            type: "object",
            properties: {
                module_id: {
                    type: "string",
                    description: "ID của module chứa bài học.",
                },
                lesson_title: {
                    type: "string",
                    description: "Tên bài học (ví dụ: 'Lý thuyết & Cách dùng cơ bản').",
                },
                lesson_type: {
                    type: "string",
                    description: "Loại bài học.",
                    enum: ["theory", "exercise", "interactive_chat", "quiz"],
                },
                order: {
                    type: "integer",
                    description: "Vị trí của bài học trong module (bắt đầu từ 1).",
                },
            },
            required: ["module_id", "lesson_title", "lesson_type", "order"],
        },
    },
};

export interface AddLessonToModuleArgs {
    module_id: string;
    lesson_title: string;
    lesson_type: "theory" | "exercise" | "interactive_chat" | "quiz";
    order: number;
}

export function addLessonToModuleImplementation(args: AddLessonToModuleArgs): string {
    console.log(`[Tool Mock: ${ADD_LESSON_TO_MODULE_TOOL_NAME}] Adding lesson "${args.lesson_title}" (type: ${args.lesson_type}) to module ${args.module_id} at order ${args.order}`);
    // Mock backend call
    const lesson_id = `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Tool Mock: ${ADD_LESSON_TO_MODULE_TOOL_NAME}] Generated lesson_id: ${lesson_id}`);
    return JSON.stringify({ lesson_id });
}