import { UpstreamItem } from "../manifest.js";

export const upstreamVersionToString = ({
    upstreamVersion,
    upstream
}: {
    upstreamVersion?: string;
    upstream?: UpstreamItem[];
}): string | undefined => {
    return upstreamVersion ? upstreamVersion : upstream && upstream.map(item => item.version).join(", ");
}