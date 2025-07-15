// THIS IS TEMPORARY FILE FOR LMS ASSET BLOCK
// TODO: Remove this after we have a real backend for LMS related stuff

const getLmsIdOptions = (lmsType) => {
    switch (lmsType) {
        case 'practice':
            return [
                {
                    value: {
                        id: 1,
                        content: 'Practice mẫu',
                    },
                    label: 'Practice mẫu',
                },
            ]
        case 'conversation':
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
        case 'dialogue':
            return [
                {
                    value: {
                        content: 'Animals',
                        questions: [
                            {
                                question: 'Do you like butterfly?',
                                answer: 'Yes, I do',
                            },
                            {
                                question: 'What color is it?',
                                answer: 'It is red',
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
                    type: 'speaking_unscripted',
                },
                label: 'Câu hỏi Warmup',
            },
            {
                value: {
                    id: 2,
                    content: 'What can you see?',
                    type: 'speaking_unscripted',
                },
                label: 'Câu hỏi Brainstorm',
            },
            {
                value: {
                    id: 3,
                    content: 'Is it a butterfly?',
                    transcript: 'butterfly',
                    type: 'speaking_scripted',
                },
                label: 'Câu hỏi Vocab - Listen and repeat',
            },
            {
                value: {
                    id: 4,
                    content: 'Is it a butterfly?',
                    transcript: 'butterfly',
                    type: 'speaking_scripted',
                },
                label: 'Câu hỏi Grammar - Listen and repeat',
            },
            {
                value: {
                    id: 5,
                    content: 'Is it a butterfly?',
                    type: 'true_false',
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
                    type: 'single_choice',
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
                    type: 'matching',
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

export { getLmsIdOptions, getLmsQuestionOptions }
