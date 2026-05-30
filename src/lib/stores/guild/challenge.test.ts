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

export const gradeChallengeCompileAssertions = {
    allExpectedTypesCovered: expectedTypes.every((type) => coveredTypes.has(type)),
    tenStagesCovered: coveredStages.size === 10,
    firstRankUsesMemoryMatch: challenges[0].type === 'memory-match',
    bossRankUsesSlidingPuzzle: challenges[18].type === 'sliding-puzzle',
    challengeDifficultiesStayInRange: challenges.every((challenge) => challenge.difficulty >= 1 && challenge.difficulty <= 10)
};
