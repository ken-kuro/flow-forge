export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        // allowed commit types
        'type-enum': [
            2,
            'always',
            [
                'feat', // new feature
                'fix', // bug fix
                'docs', // documentation only
                'style', // formatting, no code change
                'refactor', // code change that isn’t a feature or fix
                'perf', // performance improvement
                'test', // adding/updating tests
                'build', // build system or deps
                'ci', // CI config
                'chore', // other maintenance
                'revert', // reverts a previous commit
            ],
        ],

        // require a non-empty, lowercase scope from a defined list (a bit too restrictive, so disabled for now)
        // 'scope-enum': [2, 'always', ['core', 'cli', 'api', 'docs', 'tests']],
        // 'scope-empty': [2, 'never'],
        'scope-case': [2, 'always', 'lower-case'],

        // subject rules
        'subject-empty': [2, 'never'],
        'subject-case': [2, 'always', ['sentence-case', 'lower-case']],
        'header-max-length': [2, 'always', 50],

        // body formatting
        'body-leading-blank': [1, 'always'],
        'body-max-line-length': [2, 'always', 72],

        // footer rules
        'footer-leading-blank': [1, 'always'],
        'footer-max-line-length': [2, 'always', 72],
    },

    // skip linting for WIP commits
    ignores: [(msg) => msg.includes('WIP')],
}
