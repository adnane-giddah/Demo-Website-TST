import { Prisma } from "@prisma/client";
export type WeightedSample = {
    rating: number | null;
    weight: Prisma.Decimal | number | string;
};
export type WeightedResult = {
    average: number | null;
    count: number;
    totalWeight: number;
};
const ZERO = new Prisma.Decimal(0);
function toDecimal(value: Prisma.Decimal | number | string): Prisma.Decimal {
    return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}
export function weightedAverage(samples: readonly WeightedSample[]): WeightedResult {
    let weightedSum = ZERO;
    let weightSum = ZERO;
    let count = 0;
    for (const sample of samples) {
        if (sample.rating === null || sample.rating === undefined)
            continue;
        const weight = toDecimal(sample.weight);
        if (weight.lessThanOrEqualTo(0))
            continue;
        weightedSum = weightedSum.plus(weight.times(sample.rating));
        weightSum = weightSum.plus(weight);
        count += 1;
    }
    if (count === 0 || weightSum.lessThanOrEqualTo(0)) {
        return { average: null, count: 0, totalWeight: 0 };
    }
    return {
        average: weightedSum.dividedBy(weightSum).toDecimalPlaces(6).toNumber(),
        count,
        totalWeight: weightSum.toDecimalPlaces(4).toNumber(),
    };
}
export function plainAverage(ratings: readonly (number | null)[]): number | null {
    const values = ratings.filter((r): r is number => r !== null && r !== undefined);
    if (values.length === 0)
        return null;
    const sum = values.reduce((total, value) => total + value, 0);
    return Math.round((sum / values.length) * 1e6) / 1e6;
}
export function ratingDistribution(ratings: readonly (number | null)[]): number[] {
    const buckets = new Array<number>(10).fill(0);
    for (const rating of ratings) {
        if (rating === null || rating === undefined)
            continue;
        if (rating < 1 || rating > 10)
            continue;
        buckets[rating - 1] += 1;
    }
    return buckets;
}
