import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { ADD_MODULE_TO_COURSE_TOOL_NAME } from './toolNames';

export const addModuleToCourseToolDefinition: ChatCompletionTool = {
    type: "function",
    function: {
        name: ADD_MODULE_TO_COURSE_TOOL_NAME,
        description: "Thêm một module (chương/phần lớn) vào khóa học.",
        parameters: {
            type: "object",
            properties: {
                course_id: {
                    type: "string",
                    description: "ID của khóa học đã được tạo trước đó.",
                },
                module_title: {
                    type: "string",
                    description: "Tên của module (ví dụ: 'Ôn Tập Nhanh Simple Past').",
                },
                module_description: {
                    type: "string",
                    description: "Mô tả ngắn gọn module này sẽ học gì.",
                },
                order: {
                    type: "integer",
                    description: "Vị trí của module trong khóa học (bắt đầu từ 1).",
                },
            },
            required: ["course_id", "module_title", "module_description", "order"],
        },
    },
};

export interface AddModuleToCourseArgs {
    course_id: string;
    module_title: string;
    module_description: string;
    order: number;
}

export function addModuleToCourseImplementation(args: AddModuleToCourseArgs): string {
    console.log(`[Tool Mock: ${ADD_MODULE_TO_COURSE_TOOL_NAME}] Adding module "${args.module_title}" to course ${args.course_id} at order ${args.order}`);
    // Mock backend call
    const module_id = `module_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Tool Mock: ${ADD_MODULE_TO_COURSE_TOOL_NAME}] Generated module_id: ${module_id}`);
    return JSON.stringify({ module_id });
}