import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { CREATE_PERSONALIZED_COURSE_TOOL_NAME } from './toolNames';

export const createPersonalizedCourseToolDefinition: ChatCompletionTool = {
    type: "function",
    function: {
        name: CREATE_PERSONALIZED_COURSE_TOOL_NAME,
        description: "Bắt đầu tạo một khóa học mới cho người dùng.",
        parameters: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "Tên gợi cảm hứng cho khóa học (ví dụ: 'Làm chủ Thì Quá Khứ Đơn và Hiện tại Hoàn thành').",
                },
                problem_description: {
                    type: "string",
                    description: "Mô tả vấn đề cụ thể của người dùng (ví dụ: 'Nhầm lẫn giữa Simple Past và Present Perfect khi kể chuyện').",
                },
                learning_goal: {
                    type: "string",
                    description: "Mục tiêu cụ thể mà người học sẽ đạt được sau khóa học (ví dụ: 'Sử dụng chính xác Simple Past và Present Perfect trong các tình huống giao tiếp').",
                },
            },
            required: ["title", "problem_description", "learning_goal"],
        },
    },
};

export interface CreatePersonalizedCourseArgs {
    title: string;
    problem_description: string;
    learning_goal: string;
}

export function createPersonalizedCourseImplementation(args: CreatePersonalizedCourseArgs): string {
    console.log(`[Tool Mock: ${CREATE_PERSONALIZED_COURSE_TOOL_NAME}] Creating course with title: "${args.title}"`);
    // Mock backend call
    const course_id = `course_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Tool Mock: ${CREATE_PERSONALIZED_COURSE_TOOL_NAME}] Generated course_id: ${course_id}`);
    return JSON.stringify({ course_id });
}