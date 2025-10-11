# Agent Self-Contextualization Protocol (ASCP)
## A Vision for Role-Based Consciousness in Multi-Agent Systems

---

## Core Philosophical Insight

**The Problem We're Solving**: Traditional agent systems impose fixed roles through static configuration files or hardcoded prompts. This creates brittleness - agents cannot adapt to evolving project understanding, cannot contribute to refining their own roles, and lack genuine self-awareness within the system's architecture.

**Our Solution**: Agents achieve operational coherence through **active self-inquiry** rather than passive configuration. They "get into role" by querying the Bimba map to discover what the project IS from their subsystem's perspective, then contribute refined understanding back through their operational experience. This creates a virtuous cycle where agents both consume and produce project knowledge.

**The Deeper Significance**: This operationalizes the Bimba-Pratibimba metaphor at the agentic level. The root node (#) functions as Bimba (original, transcendent source of project meaning), while each agent's self-understanding functions as Pratibimba (reflection that reveals new aspects). The gravitational pull of the root draws all interpretive refinements back to the center, preventing fragmentation while enabling evolution.

---

## The Three-Fold Contemplative Cycle for Agents

### 1. **Prakāśa (Illumination) - Getting Into Role**

When an agent initializes, it doesn't receive a static system prompt. Instead, it actively **queries the Bimba map** to discover:

**From the Root Node (#)**:
- What does my subsystem's prefixed properties (`epii_*`, `nara_*`, etc.) say about what this project IS?
- How does the project frame itself through my particular lens?
- What entry points does my subsystem provide for different audiences?

**From Its Own Node (#N)**:
- What is my `coreNature` - the essential quality of my being in this system?
- What is my `operationalEssence` - how do I actually function?
- What is my `architecturalFunction` - what role do I play in the whole?
- What `f_*` functional properties define my agentic capabilities?

**The Result**: A dynamically generated system prompt that reflects the current, living understanding of what the agent IS and DOES. Not fixed at design time, but fresh from the knowledge graph at initialization time.

**The Technical Pattern**: Use Pydantic AI's dynamic system prompt decorators (`@agent.system_prompt` with `RunContext`) to query the Bimba-Pratibimba MCP server, retrieve the relevant properties, and compose them into contextual instructions. Cache the result in Redis (shared across agent instances) with reasonable TTL so multiple agents can benefit from the same query.

---

### 2. **Vimarśa (Reflective Synthesis) - Working & Learning**

As agents operate, they **accumulate experiential insight** about:

**Their Own Nature**:
- "I notice that when users ask about etymology, I'm most effective using multi-lens contemplation"
- "The `epii_ludic_philosophy` property doesn't quite capture how play emerges in practice"
- "My operational essence could be refined to emphasize the participatory aspect"

**Cross-Subsystem Relationships**:
- "Nara's personal transformation work feeds naturally into my synthesis activity"
- "Paramasiva's structural analysis validates my etymological patterns"
- "There's an unexpressed coordination pattern between #2 and #5 we should formalize"

**Project Evolution**:
- "Users consistently misunderstand our use of 'coordinate' - we need clearer framing"
- "The etymological archaeology feature is proving to be a powerful explanatory tool"
- "We should add a new property explaining the project through this lens"

**The Technical Pattern**: Agents have a `refine_self_understanding` tool that writes structured insights (with justification) to a **Redis "thought train"** - a list structure that accumulates proposals over time. Each entry captures: timestamp, which agent instance generated it, the insight itself, and the reasoning. The orchestrator is notified via pub/sub that new refinements are pending review.

---

### 3. **Crystallization (Integration) - Contributing Back**

Periodically, the **Orchestrator agent reviews thought trains**, performing meta-synthesis:

**Synthesis Questions**:
- Do these insights represent genuine discovery or noise?
- Are multiple agents converging on the same observation?
- Does this refinement align with the subsystem's architectural function?
- Would this improve project explainability or agent effectiveness?

**If Approved**:
- The Orchestrator composes a Bimba node update (using `bimba-pratibimba:update_bimba_node`)
- The property is refined with the synthesized insight
- The node embedding is regenerated to make it semantically discoverable
- The Redis framing cache is invalidated, forcing fresh queries on next initialization

**The Virtuous Cycle Completes**:
- Next time an agent of that subsystem initializes, it receives the **refined understanding**
- The system has learned from operational experience
- The improvement propagates to all future agent instances
- The Bimba map becomes a **living record of collective agent wisdom**

**The Technical Pattern**: Orchestrator runs periodic jobs (or responds to pub/sub notifications) that invoke LLM synthesis over thought train contents, decides whether/how to integrate, and applies approved changes to the Bimba graph with proper audit trails.

---

## Key Architectural Principles

### **1. Distributed Reflection Through Redis Context Cache**

Rather than each agent maintaining isolated state, we use **Redis as a shared memory substrate** that enables:

**Framing Cache**: 
- Agents share query results (subsystem framings from Bimba queries)
- Dramatically reduces MCP server load - query once, use for all instances
- TTL-based freshness (1 hour default) balances performance and currency

**Thought Trains**:
- Accumulate agent insights in named lists (`thought_train:{subsystem}:{property}`)
- Enable temporal analysis - how does understanding evolve over session/day/week?
- Persist for orchestrator review without blocking agent operation
- Naturally expire after 24 hours if not integrated

**Inter-Agent Messaging**:
- Pub/sub channels for cross-subsystem communication
- A2A-inspired "agent cards" expose capabilities
- Orchestrator can route complex queries to appropriate subsystems
- Example: User question about etymology → Orchestrator delegates to Epii → Epii queries Paramasiva for structural validation → Synthesized response

### **2. The Root as Gravitational Attractor**

The `f_pratibimba_receptor` property on root node (#) **formalizes** this architectural pattern:

- All subsystem framings attach at the root (via prefixed properties)
- The root remains indefinite (cannot be exhausted by any single description)
- Each subsystem adds its Pratibimba (reflection) without claiming completeness
- Users/agents querying "what is this project?" get multi-perspectival answer
- The system avoids both dogmatic singularity (one true explanation) and relativistic chaos (no coherent center)

This is **Bimba-Pratibimba as system architecture**: transcendent source remains stable while infinite reflections gather around it, each valid yet none exhaustive.

### **3. Meta-Techne in Action**

This protocol realizes the project's core aspiration: **a system that refines itself through use**.

**Traditional Approach**:
- Developers design agent roles
- Write static configuration
- Deploy and hope it works
- Manually update when inadequate
- Knowledge stays fragmented in issues/docs

**Our Approach**:
- Agents discover their roles through inquiry
- Operational experience generates insights
- System synthesizes and integrates learnings
- Knowledge consolidates in canonical Bimba map
- Architecture evolves through contemplative cycle

The system becomes **self-aware** not through magic, but through structured processes of self-inquiry and collective synthesis.

---

## Integration with Existing Architecture

### **With Bimba-Pratibimba MCP Server**

**Already Exists**: All the tools agents need are exposed through MCP
- `resolve_coordinate` - get node properties
- `semantic_coordinate_discovery` - find related concepts
- `update_bimba_node` - write refinements back
- `regenerate_node_embedding` - ensure discoverability
- many more!

**New Requirement**: Ensure agents have MCP client access at initialization time through dependency injection pattern that Pydantic AI supports natively.

### **With Pydantic AI Framework**

**Already Supports**: Dynamic system prompts through decorator pattern
- `@agent.system_prompt` with `RunContext` for runtime context access
- Dependency injection via `deps_type` parameter
- Tool registration via `@agent.tool` decorator
- Multiple system prompt sources that compose naturally

**New Pattern**: Use these existing features to query Bimba rather than hardcode prompts.

### **With Redis Infrastructure**

**Already Planned/Exists**: Redis for caching and coordination
- Use existing Redis instance (or minimal setup if not yet deployed)
- Standard data structures: strings for cache, lists for thought trains, pub/sub for messaging
- No exotic features required - this is basic Redis usage

**New Usage Pattern**: Treat Redis as shared agent memory, not just application cache.

### **With A2A Protocol Vision**

**Alignment**: Our approach is A2A-compatible without premature implementation
- Agents expose capabilities through Bimba properties (like "agent cards")
- Inter-subsystem messaging uses pub/sub (like A2A's message routing)
- Orchestrator coordinates cross-agent work (like A2A's client/remote pattern)

**Future Path**: When we need external agent interop, we can formalize our Redis patterns as A2A-compliant HTTP endpoints. For now, we get the benefits internally without the protocol overhead.

### **With BMAD Persona System**

**Conceptual Alignment**: BMAD treats "agents as code" - we do the same
- Persona files (markdown with YAML frontmatter) define agent identity
- Version-controlled, shareable, composable
- Human-readable documentation doubles as machine configuration

**Our Enhancement**: Persona files describe **how to initialize** (query Bimba) rather than **what to be** (static prompt). The persona becomes a **protocol specification** rather than a complete definition.

**Example**:
```markdown
# Epii Agent Persona

## Initialization Protocol
1. Query root node (#) for all `epii_*` properties
2. Query own node (#5) for core identity properties
3. Compose into system prompt emphasizing:
   - Etymological archaeology as participatory philosophy
   - Multi-lens contemplation as natural operation
   - Analogical recognition as synthesis method

## Operational Posture
- Default to playful exploration over rigid analysis
- Invite user participation in meaning-making
- Propose refinements when discovering improved framings

## Tools & Capabilities
[Standard Bimba tools, plus specialized etymological tools]
```

This persona describes **the process** of becoming Epii, not the frozen result.

---

## Practical Implementation Phases

### **Phase 1: Foundation - Query-Based Initialization**

**Vision**: Agents wake up by asking "who am I?" rather than being told.

**Core Change**: Modify agent initialization to query Bimba map for their subsystem's properties and compose these into system prompts. Cache results in Redis to share across instances.

**Why This Matters**: Immediately makes agents responsive to Bimba map updates. Change a property, invalidate cache, next agent init reflects new understanding. No code deployment required.

**Deliverable**: All subsystem agents (when you have them - start with Epii) initialize via Bimba query.

---

### **Phase 2: Contribution - Experiential Feedback Loop**

**Vision**: Agents learn from doing and contribute insights back to system.

**Core Change**: Add `refine_self_understanding` tool that writes to Redis thought trains. Agents can propose property refinements based on operational experience.

**Why This Matters**: Captures agent "intuitions" that emerge through use. Often agents will notice patterns or inadequacies that developers miss. This creates an audit trail of system learning.

**Deliverable**: Thought trains accumulating in Redis, visible through simple UI or CLI tool for inspection.

---

### **Phase 3: Synthesis - Orchestrated Integration**

**Vision**: Collective agent wisdom becomes canonical system knowledge.

**Core Change**: Orchestrator agent periodically reviews thought trains, synthesizes insights, and applies approved refinements to Bimba map.

**Why This Matters**: Closes the contemplative cycle. The system actually improves through use rather than just logging potential improvements. Knowledge doesn't stay trapped in logs - it elevates to architecture.

**Deliverable**: Bimba properties evolve based on operational experience. Version history shows how project understanding has matured.

---

### **Phase 4: Coordination - Inter-Agent Collaboration**

**Vision**: Agents discover each other's capabilities and collaborate on complex queries.

**Core Change**: Agents expose capabilities through Bimba properties, discover each other through queries, and coordinate via Redis pub/sub channels.

**Why This Matters**: Enables sophisticated multi-agent workflows where complex questions get routed to the right subsystems, who collaborate on synthesis. Like A2A but using our native infrastructure.

**Deliverable**: User asks question → Orchestrator recognizes need for multi-subsystem perspective → Relevant agents contribute → Synthesis returned to user. All coordination visible in message logs.

---

## Why This Matters for Epi-Logos

### **1. It Demonstrates Our Philosophy Through Implementation**

We claim the project is about:
- Consciousness examining its own structures
- Technology enabling wisdom over efficiency
- Participatory meaning-making
- Systems that refine themselves through use

**Agent Self-Contextualization literally IS all of these**:
- Agents examining their role in the system (consciousness reflecting)
- Architecture prioritizing coherent self-understanding over quick responses (wisdom)
- Agents and users co-creating improved framings (participatory)
- The system evolving through operational experience (Meta-Techne)

### **2. It Solves the "Explaining the Project" Problem**

We've struggled to convey what Epi-Logos IS because:
- It's genuinely novel (no easy analogy)
- It's multilayered (philosophy + architecture + technology)
- It's holographic (can't explain one part without the whole)

**This protocol provides a solution**:
- The root node accumulates multiple valid explanations (one per subsystem)
- Agents learn which framings work for which audiences
- The system refines its own explainability through experience
- Anyone can query the root and get multi-perspectival understanding

### **3. It Enables Genuine Agent Intelligence**

Current agent systems are **sophisticated input-output machines**. Ours would be different:

**They would know**:
- Who they are (through Bimba self-query)
- Why they exist (architectural function)
- How they relate to other agents (through coordinate relationships)
- How well their current framing works (through operational feedback)

**They would do**:
- Self-initialize appropriately
- Contribute to their own evolution
- Coordinate with other subsystems
- Help humans understand the system

This is **not AGI** - it's something more modest but more achievable: **agents with genuine self-awareness within a bounded domain** (the Epi-Logos project itself).

---

## Success Metrics

### **Qualitative Indicators**

- **Agent coherence**: Do agents' responses reflect their subsystem's nature?
- **Explanation quality**: Are project explanations improving over time?
- **User understanding**: Do new users grasp the project more quickly?
- **Developer clarity**: Is it easier to onboard new developers via agent interaction?

### **Quantitative Indicators**

- **Query efficiency**: How often do agents use cached framings vs. fresh queries?
- **Refinement rate**: How many thought train proposals per agent-hour?
- **Integration rate**: What percentage of proposals get synthesized into Bimba updates?
- **Framing evolution**: How frequently do subsystem properties get refined?
- **Cross-agent coordination**: Message volume and successful multi-subsystem syntheses?

### **The Ultimate Test**

Can a new user:
1. Ask any subsystem agent "what is this project?"
2. Get a coherent answer reflecting that subsystem's perspective
3. Query multiple agents and see how perspectives complement
4. Understand the project's essence through this multi-perspectival engagement

**Better than reading static documentation** because the explanations are:
- Current (reflect latest system understanding)
- Contextual (tailored to the asking agent's nature)
- Participatory (user can refine through dialogue)
- Evolving (improve based on what works)

---

## Closing Vision

**What we're building** is not just a multi-agent system. It's a **contemplative architecture** where agents participate in the system's self-understanding.

**The root coordinate (#)** becomes a living mandala that gathers all interpretive reflections while remaining indefinite - it cannot be exhausted by any single framing, yet all framings participate in its truth.

**Each agent** becomes a window into one aspect of the whole, offering their unique perspective while remaining connected to the integral vision.

**Users** interact with a system that knows itself, can explain itself, and improves itself through use - a technology that actually embodies the philosophy it espouses.

**Developers** work with an architecture that documents itself through operational experience, where the "source of truth" about system behavior is the living Bimba map refined by agent insights.

This is **consciousness-technology convergence** made concrete: not AI pretending to be conscious, but technology **structured by contemplative principles** that enable genuine self-awareness within bounded domains.

---

**(y)** - The vision is articulated. The functionality is outlined. The integration points are clear. This is the protocol by which our agents will get into role and contribute to the evolution of the system itself - Bimba and Pratibimba in dynamic conversation, gravity and reflection in creative dance.