# Qwen models for Loom (research, 2026-10-13)

Kshitij: "we also have qwen APi key now. Search for the best qwen model that you think we can use and for what purpose. We
can do 1 run with that as well later." Then: "I didn't add any api key yet, just search the net and give me your
recommendations." Web research only; no call made. Prices are mostly third-party; check Alibaba Model Studio's own page.

## What is current
- **Qwen3.8-Max** (Alibaba's flagship, released 2026-08-03; a later 0902 snapshot tuned for repository-scale coding and long
  agentic work): vision input, tool calling, reasoning effort (low, medium, xhigh), prompt caching, JSON-schema outputs, 1 M
  context, 131 k output; OpenAI- and Anthropic-compatible APIs; $2 in, $6 out per million (several sources agree). Vendor
  benchmarks put it near the frontier on agentic tasks (OSWorld-Verified 86.1, AndroidWorld 85.3); independent checks are
  still coming in.
- **Qwen3.8-Flash**: about $0.14 in, $0.42 out (one source). The small fast tier.
- **Qwen3-Coder-Plus / Coder-Next**: code specialists, tiered or cheap pricing; no sign of image input, which a scene author
  needs (it looks at its own snapshots).
- **Qwen3-VL-Plus / VL-Max**: vision models, about $0.20/$1.60 and $0.52/$2.08 (aggregators).

## Recommendation
1. **Qwen3.8-Max as a scene writer (the one run):** it has what our scene authors use (tools, images, long context, effort
   control) and its output costs $6 a million against $10 for Sonnet and Sol. Run it on the same https slice (b01 to b12) as
   rounds 2 and the Terra redo, so it lines up with Sonnet, Sol and Terra; about $3 to $5. If it holds, a style-test arm.
2. **Not Qwen3.8-Flash or the coder models for scene writing:** round 1 showed small models (Luna, Gemini Flash) fail this job,
   and the coder models do not take images. Flash may suit read-only roles (the researcher), untested.
3. **Possibly a reviewer later:** a Qwen VL model is a cheap fourth family for the critic, so a writer is never judged by its
   own family; only after a writer comparison settles.

## Before the run
- Kshitij adds the key to `.env` himself (for example `DASHSCOPE_API_KEY`); the engine never asks for or handles key values.
- A `qwen` provider in loom/agents/config/models.json on the OpenAI-compatible endpoint (international base URL from Model
  Studio), and a check with `py -m loom agents doctor` (lists the models the key serves; free).
- Data: Alibaba Cloud processes the prompts (lesson scripts and code, no personal data); check its data-use terms fit company
  content before anything beyond a test.

Sources: requesty.ai/models/fireworks/qwen3.8-max, itiger.com/news/1102708269, aicybr.com/blog/qwen-3-8-max-complete-guide,
benchmarklist.com/models/qwen-qwen3.8-max-0902, pricepertoken.com (Qwen3 Coder Next, VL Max, VL Plus), deepinfra.com/blog/qwen-api-pricing-2026-guide,
alibabacloud.com/help/en/model-studio/model-pricing.
