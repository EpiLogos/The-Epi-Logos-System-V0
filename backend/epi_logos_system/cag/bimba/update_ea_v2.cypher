// Update EA Workflow to v2 with Graphiti Enrichment Awareness
// Run this Cypher script in Neo4j Browser or via cypher-shell

// Step 1: Load the v2 prompt into a parameter (you'll need to replace this with actual prompt)
// For direct Neo4j execution, the prompt content should be passed as a parameter

// Step 2: Update the node with v2 properties
MATCH (n:BimbaNode {bimbaCoordinate: "#5-4.5"})
SET n.f_workflow_etymology_archaeology_v2 = $v2_prompt
SET n.f_workflow_etymology_archaeology_active = "v2"
SET n.f_workflow_etymology_archaeology_version_history =
  n.f_workflow_etymology_archaeology_version_history + [
    {
      version: "v2",
      created_at: datetime().epochMillis,
      changes: "Added Graphiti enrichment tool awareness for depth accrual: enrich_community_properties, enrich_word_node, link_aphorism_to_community. Enhanced example flows showing property enrichment during conversation. Added Phase 5 (Depth accrual) to exploration phases.",
      author: "system"
    }
  ]
RETURN n.bimbaCoordinate as coordinate,
       n.name as name,
       n.f_workflow_etymology_archaeology_active as active_version,
       size(n.f_workflow_etymology_archaeology_version_history) as version_count;

// Step 3: Verify the update
MATCH (n:BimbaNode {bimbaCoordinate: "#5-4.5"})
RETURN n.f_workflow_etymology_archaeology_active as active_version,
       size(n.f_workflow_etymology_archaeology_v2) as v2_prompt_length,
       n.f_workflow_etymology_archaeology_version_history as history;
