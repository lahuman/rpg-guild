import { GRADE_ORDER, getGradeChallenge, type GradeChallengeType } from './constants';

const expectedTypes: GradeChallengeType[] = [
    'memory-match',
    'aim-trainer',
    'timing-bar',
    'simon-says',
    'color-spotter',
    'word-typing',
    'mental-math',
    'catch-drop',
    'dodge-blocks',
    'sliding-puzzle'
];

const challenges = GRADE_ORDER.map((grade) => getGradeChallenge(grade));
const coveredTypes = new Set(challenges.map((challenge) => challenge.type));
const coveredStages = new Set(challenges.map((challenge) => challenge.stage));

function assertTest(name: string, passed: boolean) {
    if (!passed) {
        throw new Error(`Grade challenge assertion failed: ${name}`);
    }
    return passed;
}

function getDodgeChallenge(grade: Parameters<typeof getGradeChallenge>[0]) {
    const challenge = getGradeChallenge(grade);
    if (challenge.type !== 'dodge-blocks') {
        throw new Error(`${grade} should use dodge-blocks`);
    }
    return challenge;
}

const rank18DodgeChallenge = getDodgeChallenge('Rank18');

export const gradeChallengeCompileAssertions = {
    allExpectedTypesCovered: assertTest('allExpectedTypesCovered', expectedTypes.every((type) => coveredTypes.has(type))),
    tenStagesCovered: assertTest('tenStagesCovered', coveredStages.size === 10),
    firstRankUsesMemoryMatch: assertTest('firstRankUsesMemoryMatch', challenges[0].type === 'memory-match'),
    bossRankUsesSlidingPuzzle: assertTest('bossRankUsesSlidingPuzzle', challenges[18].type === 'sliding-puzzle'),
    challengeDifficultiesStayInRange: assertTest(
        'challengeDifficultiesStayInRange',
        challenges.every((challenge) => challenge.difficulty >= 1 && challenge.difficulty <= 10)
    ),
    rank18DodgeStartsGently: assertTest('rank18DodgeStartsGently', rank18DodgeChallenge.blockCount <= 5
        && rank18DodgeChallenge.blockSpeed <= 1.7
        && rank18DodgeChallenge.startDelayMs >= 1500)
};
