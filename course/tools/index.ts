import { ChatCompletionTool } from 'openai/resources/chat/completions';

import {
    CREATE_PERSONALIZED_COURSE_TOOL_NAME,
    ADD_MODULE_TO_COURSE_TOOL_NAME,
    ADD_LESSON_TO_MODULE_TOOL_NAME,
    ADD_CONTENT_TO_LESSON_TOOL_NAME,
} from './toolNames';

import {
    createPersonalizedCourseToolDefinition,
    createPersonalizedCourseImplementation,
    CreatePersonalizedCourseArgs
} from './createPersonalizedCourseTool';
import {
    addModuleToCourseToolDefinition,
    addModuleToCourseImplementation,
    AddModuleToCourseArgs
} from './addModuleToCourseTool';
import {
    addLessonToModuleToolDefinition,
    addLessonToModuleImplementation,
    AddLessonToModuleArgs
} from './addLessonToModuleTool';
import {
    addContentToLessonToolDefinition,
    addContentToLessonImplementation,
    AddContentToLessonArgs
} from './addContentToLessonTool';

// Export all tool names for convenience (e.g., for system prompt)
export * from './toolNames';

// Array of all tool definitions for OpenAI API
export const allToolDefinitions: ChatCompletionTool[] = [
    createPersonalizedCourseToolDefinition,
    addModuleToCourseToolDefinition,
    addLessonToModuleToolDefinition,
    addContentToLessonToolDefinition,
];

// Map of tool names to their implementations for easy dispatch
export const toolImplementations: { [key: string]: (...args: any[]) => string } = {
    [CREATE_PERSONALIZED_COURSE_TOOL_NAME]: (args: CreatePersonalizedCourseArgs) => createPersonalizedCourseImplementation(args),
    [ADD_MODULE_TO_COURSE_TOOL_NAME]: (args: AddModuleToCourseArgs) => addModuleToCourseImplementation(args),
    [ADD_LESSON_TO_MODULE_TOOL_NAME]: (args: AddLessonToModuleArgs) => addLessonToModuleImplementation(args),
    [ADD_CONTENT_TO_LESSON_TOOL_NAME]: (args: AddContentToLessonArgs) => addContentToLessonImplementation(args),
};