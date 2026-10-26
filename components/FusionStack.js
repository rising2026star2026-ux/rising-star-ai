// لوجوهات النماذج المشتركة في «دمج 4 نماذج» فوق بعض
import BotIcon from "./BotIcon";
import { BOTS } from "@/lib/bots";

const DEFAULT = ["gpt-oss-120b", "kimi-k2", "llama4-maverick", "qwen3-32b"]
  .map((k) => BOTS.find((b) => b.key === k))
  .filter(Boolean)
  .map((b) => ({ name: b.name, logo: b.logo }));

export default function FusionStack({ items = DEFAULT, size = 20, pulse = false }) {
  return (
    <span className={`fusion-stack${pulse ? " pulse" : ""}`} aria-hidden="true">
      {items.slice(0, 4).map((m, i) => (
        <span key={i} className="fusion-dot" style={{ "--i": i }}>
          <BotIcon bot={{ name: m.name, logo: m.logo, mono: m.name.slice(0, 2), tint: "#4f46e5" }} size={size} />
        </span>
      ))}
    </span>
  );
}
