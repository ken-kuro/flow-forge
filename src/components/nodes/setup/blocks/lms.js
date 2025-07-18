// THIS IS TEMPORARY FILE FOR LMS ASSET BLOCK
// TODO: Remove this after we have a real backend for LMS related stuff

const LMS_TYPES = {
    PRACTICE: 'practice',
    CONVERSATION: 'conversation',
    DIALOGUE: 'dialogue',
    GAME: 'game',
}

const QUESTION_TYPES = {
    SPEAKING_UNSCRIPTED: 'speaking_unscripted',
    SPEAKING_SCRIPTED: 'speaking_scripted',
    TRUE_FALSE: 'true_false',
    SINGLE_CHOICE: 'single_choice',
    MATCHING: 'matching',
}

const getLmsIdOptions = (lmsType) => {
    switch (lmsType) {
        case LMS_TYPES.PRACTICE:
            return [
                {
                    value: {
                        id: 1,
                        content: 'Practice mẫu',
                    },
                    label: 'Practice mẫu',
                },
            ]
        case LMS_TYPES.CONVERSATION:
            return [
                {
                    value: {
                        id: 1,
                        content: 'Animals',
                        vocabularies: ['ant', 'butterfly', 'ladybug', 'spider'],
                        related_vocabularies: ['ant', 'butterfly', 'ladybug', 'spider'],
                        grammars: ['It is an ant', 'This is a butterfly'],
                    },
                    label: 'Conversation mẫu',
                },
            ]
        case LMS_TYPES.DIALOGUE:
            return [
                {
                    value: {
                        content: 'Animals',
                        imageUrl: 'https://scontent.rinoedu.ai/teacherroger/Ver2/5Dialogue/img_dialogue.webp',
                        backgroundImageUrl:
                            'https://scontent.rinoedu.ai/teacherroger/Ver2/5Dialogue/img_bg_conversation.webp',
                        messages: [
                            {
                                name: 'Andrew',
                                text: "Hello there! Let's talk about insects!",
                                role: 'teacher',
                                imageUrl: null,
                            },
                            {
                                name: 'You',
                                text: 'Yes! I love insects!',
                                role: 'student',
                                imageUrl: null,
                            },
                            {
                                name: 'Andrew',
                                text: 'How many butterflies are there?',
                                role: 'teacher',
                                imageUrl:
                                    'https://scontent.rinoedu.ai/teacherroger/Ver2/5Dialogue/img_dialogue_butterfly.webp',
                            },
                            {
                                name: 'You',
                                text: 'There are three butterflies',
                                role: 'student',
                                imageUrl: null,
                            },
                            {
                                name: 'Andrew',
                                text: 'Yes! What about ladybugs? How many ladybugs are there?',
                                role: 'teacher',
                                imageUrl:
                                    'https://scontent.rinoedu.ai/teacherroger/Ver2/5Dialogue/img_dialogue_lady_bug.webp',
                            },
                            {
                                name: 'You',
                                text: 'There is one ladybug.',
                                role: 'student',
                                imageUrl: null,
                            },
                            {
                                name: 'Andrew',
                                text: 'What color is the ladybug?',
                                role: 'teacher',
                                imageUrl: null,
                            },
                            {
                                name: 'You',
                                text: "It's red and black.",
                                role: 'student',
                                imageUrl: null,
                            },
                            {
                                name: 'Andrew',
                                text: 'Look at the ants. How many ants are there?',
                                role: 'teacher',
                                imageUrl:
                                    'https://scontent.rinoedu.ai/teacherroger/Ver2/5Dialogue/img_dialogue_ant.webp',
                            },
                            {
                                name: 'You',
                                text: 'There are six ants.',
                                role: 'student',
                                imageUrl: null,
                            },
                            {
                                name: 'Andrew',
                                text: 'Have you ever seen a spider?',
                                role: 'teacher',
                                imageUrl:
                                    'https://scontent.rinoedu.ai/teacherroger/Ver2/5Dialogue/img_dialogue_spider.webp',
                            },
                            {
                                name: 'You',
                                text: "No, I don't. I don't really like spider.",
                                role: 'student',
                                imageUrl: null,
                            },
                        ],
                    },
                    label: 'Dialogue mẫu',
                },
            ]
        default:
            return []
    }
}

const getLmsQuestionOptions = (practiceId) => {
    if (practiceId === 1) {
        return [
            {
                value: {
                    id: 1,
                    content: 'What is the weather today?',
                    type: QUESTION_TYPES.SPEAKING_UNSCRIPTED,
                },
                label: 'Câu hỏi Warmup',
            },
            {
                value: {
                    id: 2,
                    content: 'What can you see?',
                    type: QUESTION_TYPES.SPEAKING_UNSCRIPTED,
                },
                label: 'Câu hỏi Brainstorm',
            },
            {
                value: {
                    id: 3,
                    content: 'Is it a butterfly?',
                    transcript: 'butterfly',
                    type: QUESTION_TYPES.SPEAKING_SCRIPTED,
                },
                label: 'Câu hỏi Vocab - Listen and repeat',
            },
            {
                value: {
                    id: 4,
                    content: 'Is it a butterfly?',
                    transcript: 'butterfly',
                    type: QUESTION_TYPES.SPEAKING_SCRIPTED,
                },
                label: 'Câu hỏi Grammar - Listen and repeat',
            },
            {
                value: {
                    id: 5,
                    content: 'Is it a butterfly?',
                    type: QUESTION_TYPES.TRUE_FALSE,
                    image_url: 'https://scontent.rinoedu.ai/teacherroger/Ver2/3Vocab/intro_butterfly.png',
                    answers: ['Yes, it is', 'No'],
                    correct_answer: ['Yes, it is'],
                },
                label: 'Câu hỏi True/False',
            },
            {
                value: {
                    id: 6,
                    content: 'Is it a butterfly?',
                    type: QUESTION_TYPES.SINGLE_CHOICE,
                    image_url: 'https://scontent.rinoedu.ai/teacherroger/Ver2/3Vocab/intro_butterfly.png',
                    answers: ['Yes, it is', 'No'],
                    correct_answer: ['Yes, it is'],
                },
                label: 'Câu hỏi Single Choice',
            },
            {
                value: {
                    id: 7,
                    content: 'Matching',
                    type: QUESTION_TYPES.MATCHING,
                    list1: [
                        'https://scontent.rinoedu.ai/teacherroger/Ver2/3Vocab/intro_butterfly.png',
                        'https://scontent.rinoedu.ai/teacherroger/Ver2/3Vocab/intro_ant.png',
                        'https://scontent.rinoedu.ai/teacherroger/Ver2/3Vocab/intro_ladybug.png',
                        'https://scontent.rinoedu.ai/teacherroger/Ver2/3Vocab/intro_insects.png',
                    ],
                    list2: ['ant', 'butterfly', 'insects', 'ladybug'],
                    correct_answer: ['butterfly', 'ant', 'ladybug', 'insects'],
                },
                label: 'Câu hỏi Matching',
            },
        ]
    }
    return []
}

export { LMS_TYPES, QUESTION_TYPES, getLmsIdOptions, getLmsQuestionOptions }
