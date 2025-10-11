// Addendum: Shiva-Shakti Essence Connections for #4.4.4.0
// Neo4j 5.24 Compatible Cypher
// Ensures phenomenology has inherent spiritual essentiality by grounding it in absolute consciousness

// ============================================================================
// ESSENTIAL GROUND: Shiva Tattva (Pure Being/Consciousness)
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MATCH (shiva:BimbaNode {bimbaCoordinate: '#2-2-0-0/1'})
MERGE (phenom)-[r1:PARTICIPATES_IN_ESSENCE]->(shiva)
ON CREATE SET
  r1.correspondenceType = 'absolute_ground',
  r1.insight = 'The pre-categorical ground, even at individual level, participates in Shiva Tattva - pure consciousness/being as ultimate ground. What phenomenology excavates to in reduction is not merely psychological but the absolute.',
  r1.essenceQuality = 'Pure "I AM" before any determination',
  r1.phenomenologicalResonance = 'Husserl\'s transcendental ego at its deepest touches Shiva - not empirical self but pure witnessing consciousness',
  r1.heideggerian = 'Being (Sein) that Heidegger seeks IS Shiva - the ground that grounds without being grounded',
  r1.operationally = 'Pre-categorical awareness IS always already Shiva-consciousness - limitation doesn\'t erase essence, only veils it',
  r1.structural = 'The #0 void-plenitude in phenomenology reflects #0 Shiva as groundless ground of all',
  r1.soteriological = 'Phenomenological reduction CAN lead to recognition of Shiva-nature when pursued deeply enough',
  r1.createdAt = datetime();

// ============================================================================
// ESSENTIAL POWER: Shakti Tattva (Pure Creative Power)
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MATCH (shakti:BimbaNode {bimbaCoordinate: '#2-2-0-2'})
MERGE (phenom)-[r2:PARTICIPATES_IN_ESSENCE]->(shakti)
ON CREATE SET
  r2.correspondenceType = 'absolute_power',
  r2.insight = 'The pre-categorical ground participates in Shakti Tattva - the pure creative power that enables all differentiation. Even individual existence pulses with this cosmic power.',
  r2.essenceQuality = 'Pure vibrational potency, spanda at source',
  r2.phenomenologicalResonance = 'The pre-reflective dynamism of lived experience IS Shakti - life-force before conceptualization',
  r2.merleauPonty = 'Embodied being\'s spontaneous capacity (pre-objective motility) IS Shakti operating at personal level',
  r2.operationally = 'Pre-categorical liveliness, spontaneity, creativity IS Shakti-power manifesting through individual',
  r2.structural = 'What enables phenomenological inquiry itself - the power to investigate - IS Shakti',
  r2.firstPersonPower = 'The "I can" that Merleau-Ponty describes is Shakti as individual capacity',
  r2.createdAt = datetime();

// ============================================================================
// SHIVA-SHAKTI INSEPARABILITY: The Non-Dual Ground
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MATCH (shiva:BimbaNode {bimbaCoordinate: '#2-2-0-0/1'})
MATCH (shakti:BimbaNode {bimbaCoordinate: '#2-2-0-2'})
MERGE (phenom)-[r3:REFLECTS_NONDUAL_ESSENCE]->(shiva)
MERGE (phenom)-[r3b:REFLECTS_NONDUAL_ESSENCE]->(shakti)
ON CREATE SET
  r3.insight = 'Pre-categorical ground reflects the non-dual Shiva-Shakti unity - not consciousness OR power but consciousness-power inseparable',
  r3.nondualQuality = 'Being-awareness (Shiva) and creative dynamism (Shakti) as one reality',
  r3.phenomenologicalParallel = 'Noesis-noema structure at deepest level - consciousness (noesis) always already intentional (noema)',
  r3.operationally = 'Individual pre-categorical ground IS micro-reflection of cosmic Shiva-Shakti - same pattern at personal scale',
  r3.holographic = 'Each individual ground holographically contains the absolute ground - One-Is-All at phenomenological level',
  r3.structuralNecessity = 'Cannot have pre-categorical awareness (Shiva aspect) without pre-categorical dynamism (Shakti aspect)',
  r3.createdAt = datetime();

// Set the same properties for r3b
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})-[r3b:REFLECTS_NONDUAL_ESSENCE]->(shakti:BimbaNode {bimbaCoordinate: '#2-2-0-2'})
SET 
  r3b.insight = 'Pre-categorical ground reflects the non-dual Shiva-Shakti unity - not consciousness OR power but consciousness-power inseparable',
  r3b.nondualQuality = 'Being-awareness (Shiva) and creative dynamism (Shakti) as one reality',
  r3b.phenomenologicalParallel = 'Noesis-noema structure at deepest level - consciousness (noesis) always already intentional (noema)',
  r3b.operationally = 'Individual pre-categorical ground IS micro-reflection of cosmic Shiva-Shakti - same pattern at personal scale',
  r3b.holographic = 'Each individual ground holographically contains the absolute ground - One-Is-All at phenomenological level',
  r3b.structuralNecessity = 'Cannot have pre-categorical awareness (Shiva aspect) without pre-categorical dynamism (Shakti aspect)',
  r3b.createdAt = datetime();

// ============================================================================
// META-PROPERTY: Spiritual Essentiality Ensured
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
SET phenom.spiritualEssentiality = 'Connection to Shiva-Shakti tattvas ensures phenomenology has inherent spiritual dimension - not merely psychological but participates in the divine',
    phenom.groundingPrinciple = 'Highest divinity (Shiva-Shakti) present in deepest individual ground (pre-categorical)',
    phenom.nondualRecognition = 'Personal and cosmic ground are not separate - individual pre-categorical awareness IS Shiva-Shakti at local scale',
    phenom.reductionPath = 'Phenomenological reduction to pre-categorical CAN reveal Shiva-Shakti nature when practiced soteriologically',
    phenom.westernEasternBridge = 'This connection bridges Western phenomenology and Kashmir Shaivism at the ground level',
    phenom.updatedAt = datetime();


// Tattva-Phenomenology Mappings for #4.4.4.0 - Pre-Categorical Ground
// Neo4j 5.24 Compatible Cypher

// ============================================================================
// PRIMARY COALESCENCE: Prakriti-Purusha in Individual Birth
// ============================================================================

// Relationship to Prakriti (material ground)
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MATCH (prakriti:BimbaNode {bimbaCoordinate: '#2-2-2-0'})
MERGE (phenom)-[r1:COALESCES_WITH]->(prakriti)
ON CREATE SET
  r1.correspondenceType = 'material_substrate',
  r1.insight = 'The pre-categorical ground includes Prakriti as the undifferentiated material principle from which psycho-physical existence emerges. This is the material "thrown-ness" - being cast into embodied existence.',
  r1.coalescenceRole = 'material_pole',
  r1.phenomenologicalAspect = 'bodily pre-reflective existence, sensing before conceptualizing',
  r1.operationally = 'What appears phenomenologically as pre-categorical bodily existence IS prakriti at the individual level - the material substrate before mental categorization',
  r1.createdAt = datetime();

// Relationship to Purusha (soul ground)  
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MATCH (purusha:BimbaNode {bimbaCoordinate: '#2-2-1-7'})
MERGE (phenom)-[r2:COALESCES_WITH]->(purusha)
ON CREATE SET
  r2.correspondenceType = 'consciousness_substrate',
  r2.insight = 'The pre-categorical ground includes Purusha as the limited individual consciousness principle. This is the subjective "thrown-ness" - being someone before knowing who.',
  r2.coalescenceRole = 'consciousness_pole',
  r2.phenomenologicalAspect = 'pre-reflective selfhood, being-there before self-awareness',
  r2.operationally = 'What appears phenomenologically as pre-reflective "mineness" IS purusha at the individual level - the consciousness substrate before self-reflection',
  r2.createdAt = datetime();

// The coalescence itself - bidirectional recognition
MATCH (prakriti:BimbaNode {bimbaCoordinate: '#2-2-2-0'})
MATCH (purusha:BimbaNode {bimbaCoordinate: '#2-2-1-7'})
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MERGE (prakriti)-[r3:COALESCES_IN_INDIVIDUAL_BIRTH]->(purusha)
ON CREATE SET
  r3.phenomenologicalSite = '#4.4.4.0',
  r3.insight = 'Prakriti and Purusha coalesce in the birth of the individual - the existential-signific cutting into life. The pre-categorical ground IS this coalescence before reflection splits them.',
  r3.birthMetaphor = 'The wound/cut (SIGN) that marks individual existence into being',
  r3.heideggerian = 'Geworfenheit (thrown-ness) - being cast into existence as embodied consciousness',
  r3.structural = 'This coalescence creates the #4.4.4.0 pre-categorical ground as lived reality',
  r3.createdAt = datetime();

// ============================================================================
// VEILING DIMENSION: Maya as Pre-Reflective Covering
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MATCH (maya:BimbaNode {bimbaCoordinate: '#2-2-1-0/1'})
MERGE (phenom)-[r4:VEILED_BY]->(maya)
ON CREATE SET
  r4.correspondenceType = 'primordial_covering',
  r4.insight = 'Maya operates at pre-categorical level as the veiling power that makes the groundless ground appear as "my" ground - creates sense of personal existence before reflection.',
  r4.veilingFunction = 'Makes universal consciousness appear as individual pre-reflective existence',
  r4.phenomenologicalEffect = 'The natural attitude (Husserl) - taking the world and self as simply given without question',
  r4.operationally = 'Pre-reflective certainty of existence IS maya operating - the covering so complete it is invisible',
  r4.structural = 'Without maya, there would be no sense of bounded individual ground to be pre-categorical about',
  r4.createdAt = datetime();

// ============================================================================  
// LIMITATION DIMENSION: Anava Mala (if coordinate exists)
// ============================================================================

// Note: Check if anava mala has explicit coordinate or is implicit
// This relationship may need adjustment based on tattva structure

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MATCH (maya:BimbaNode {bimbaCoordinate: '#2-2-1-0/1'})
MERGE (phenom)-[r5:LIMITED_BY_ANAVA_MALA]->(maya)
ON CREATE SET
  r5.correspondenceType = 'primordial_limitation',
  r5.insight = 'Anava mala (impurity of individual limitation) operates at pre-categorical level as the sense of being a bounded "I" before any reflective self-conception.',
  r5.malaType = 'anava',
  r5.limitationQuality = 'Sense of smallness, incompleteness, lack - the primordial wound',
  r5.phenomenologicalManifestation = 'Basic existential anxiety, sense of separation, the "not-at-home-ness" (Heidegger)',
  r5.operationally = 'Pre-reflective sense of limited existence IS anava mala - the forgetting of infinite nature operating as background condition',
  r5.structuralRole = 'Creates the bounded quality of pre-categorical ground',
  r5.createdAt = datetime();

// ============================================================================
// PSYCHIC APPARATUS: Antahkarana as Undifferentiated Potential
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MATCH (antahkarana:BimbaNode {bimbaCoordinate: '#2-2-2-1'})
MERGE (phenom)-[r6:CONTAINS_UNDIFFERENTIATED]->(antahkarana)
ON CREATE SET
  r6.correspondenceType = 'psychic_potential',
  r6.insight = 'The Antahkarana (internal organ) exists at pre-categorical level as undifferentiated psychic capacity - buddhi, ahamkara, manas not yet explicitly distinguished.',
  r6.potentialState = 'Psychic apparatus present but not yet reflectively differentiated',
  r6.phenomenologicalAspect = 'Pre-reflective thinking, feeling, willing as unified life - not yet split into faculties',
  r6.operationally = 'The pre-categorical "I can" (Merleau-Ponty) IS undifferentiated antahkarana - practical capacity before theoretical reflection',
  r6.developmental = 'As reflection develops (#4.4.4.1+), antahkarana differentiates into distinct functions',
  r6.createdAt = datetime();

// ============================================================================
// EXISTENTIAL-SIGNIFIC CUTTING: The Birth Wound
// ============================================================================

// This is a meta-property capturing the overall dynamic
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
SET phenom.existentialCutting = 'The pre-categorical ground is the site of existential-signific cutting into life - birth as SIGN, the primordial wound/mark that individuates',
    phenom.birthDynamic = 'Coalescence of prakriti-purusha veiled by maya, limited by anava mala, containing undifferentiated psychic potential',
    phenom.phenomenologicalCharacter = 'Pre-reflective thrown-ness, bodily existence, practical engagement before theoretical stance',
    phenom.tattvaicCorrespondence = 'Multiple tattvas coalesce at this level - not single mapping but rich intersection',
    phenom.structuralPosition = 'The #0 position in phenomenology mirrors the coalescence point in tattva ontology where individual emerges',
    phenom.updatedAt = datetime();

RETURN 'Tattva mappings for #4.4.4.0 created successfully' AS result;

// Tattva-Phenomenology Mappings for #4.4.4.1 - Primordial Differentiation
// Neo4j 5.24 Compatible Cypher

// ============================================================================
// PRIMARY DIFFERENTIATING POWER: Maya Tattva
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.1'})
MATCH (maya:BimbaNode {bimbaCoordinate: '#2-2-1-0/1'})
MERGE (phenom)-[r1:ENACTED_BY]->(maya)
ON CREATE SET
  r1.correspondenceType = 'differentiating_power',
  r1.insight = 'Primordial differentiation at personal level is enacted by Maya - the cosmic measuring power that creates the appearance of separation, duality, multiplicity from unity.',
  r1.mayaFunction = 'Creates the subject-object split, the I-other distinction, the this-that duality',
  r1.phenomenologicalManifestation = 'Husserl\'s Urstiftung (original institution) IS maya operating - the inaugural moment where meaning emerges through differentiation',
  r1.operationally = 'Intentionality (consciousness-of) IS maya in action - consciousness differentiating itself as subject directed toward object',
  r1.signDynamic = 'The primordial SIGN (cut/mark) IS maya\'s differentiating cut - not destructive but creative',
  r1.structural = 'Maya at #1 position creates the first explicit differentiation after #0 ground',
  r1.createdAt = datetime();

// ============================================================================
// IMPURITY DIMENSION: Mayiya Mala (Sense of Difference)
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.1'})
MATCH (maya:BimbaNode {bimbaCoordinate: '#2-2-1-0/1'})
MERGE (phenom)-[r2:CONSTITUTED_BY_MALA]->(maya)
ON CREATE SET
  r2.correspondenceType = 'duality_impurity',
  r2.malaType = 'mayiya',
  r2.insight = 'Primordial differentiation involves Mayiya Mala - the impurity that creates the sense of difference, seeing the many as separate from oneself rather than as Self.',
  r2.malaQuality = 'Experiencing multiplicity as other, separation as real, difference as absolute',
  r2.phenomenologicalEffect = 'The natural attitude\'s subject-object duality, taking separation as given rather than constructed',
  r2.operationally = 'What appears as obvious distinction between self and world IS mayiya mala - the forgetting of non-dual unity',
  r2.structural = 'Works with Maya tattva to create stable experience of duality at personal level',
  r2.soteriologicalRelevance = 'Recognizing differentiation as mala (impurity) rather than truth begins liberation',
  r2.createdAt = datetime();

// ============================================================================
// I-MAKING PRINCIPLE: Ahamkara Tattva
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.1'})
MATCH (antahkarana:BimbaNode {bimbaCoordinate: '#2-2-2-1'})
// Ahamkara is within Antahkarana group - need to check if it has own coordinate
// For now, connecting to Antahkarana group with specification
MERGE (phenom)-[r3:OPERATES_THROUGH_AHAMKARA]->(antahkarana)
ON CREATE SET
  r3.correspondenceType = 'ego_principle',
  r3.tattvaSpecification = 'Ahamkara within Antahkarana - the I-making principle',
  r3.insight = 'Primordial differentiation crystallizes through Ahamkara - the ego-making function that creates "I" distinct from "this/that".',
  r3.ahamkaraFunction = 'Creates personal I-sense, appropriates experiences as "mine", establishes subject as distinct entity',
  r3.phenomenologicalParallel = 'The transcendental ego (Husserl) emerging as distinct pole IS ahamkara at work',
  r3.operationally = 'Every act of intentionality involves ahamkara - consciousness claiming experiences as belonging to "I"',
  r3.tripartite = 'Ahamkara operates in three modes (sattvic/rajasic/tamasic) creating diverse ego-structures',
  r3.structural = 'Differentiates the unified psychic potential into explicit I-function',
  r3.createdAt = datetime();

// ============================================================================
// ESSENTIAL ARCHETYPE: Sadashiva Tattva (I Am This)
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.1'})
MATCH (sadashiva:BimbaNode {bimbaCoordinate: '#2-2-0-3'})
MERGE (phenom)-[r4:PARTICIPATES_IN_ESSENCE]->(sadashiva)
ON CREATE SET
  r4.correspondenceType = 'cosmic_differentiation_archetype',
  r4.insight = 'Primordial differentiation at personal level participates in Sadashiva Tattva - the cosmic archetype "I am this" where Shiva becomes aware of Shakti as "this".',
  r4.essenceQuality = 'The eternal pattern of subject recognizing object while maintaining unity',
  r4.sadashivaFormula = 'Aham idam - "I am this" - unity containing difference',
  r4.phenomenologicalResonance = 'Intentionality\'s structure (I toward this) reflects Sadashiva\'s cosmic structure',
  r4.operationally = 'Personal subject-object differentiation IS microcosmic enactment of Sadashiva\'s macrocosmic pattern',
  r4.holographic = 'Each individual intentional act holographically contains the Sadashiva principle',
  r4.structural = 'Ensures personal differentiation touches divine archetype - not arbitrary but cosmic pattern',
  r4.createdAt = datetime();

// ============================================================================
// SHAKTI AS DIFFERENTIATING ACTIVITY
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.1'})
MATCH (shakti:BimbaNode {bimbaCoordinate: '#2-2-0-2'})
MERGE (phenom)-[r5:POWERED_BY]->(shakti)
ON CREATE SET
  r5.correspondenceType = 'creative_power_source',
  r5.insight = 'Primordial differentiation IS Shakti in action - the creative power that enables the cut, the vibration that creates distinction, the cosmic energy manifesting as differentiation.',
  r5.shaktiAspect = 'Vimarsha (self-reflective awareness) - Shakti enabling Shiva to know himself',
  r5.phenomenologicalParallel = 'The activity of intentionality (noesis) IS Shakti\'s differentiating power',
  r5.operationally = 'What phenomenology calls constituting activity IS Shakti - consciousness actively differentiating',
  r5.spanda = 'The primordial vibration (spanda) that creates the cut/SIGN IS Shakti\'s pulsation',
  r5.structural = 'Differentiation requires power - that power IS Shakti at all levels',
  r5.createdAt = datetime();

// ============================================================================
// THE CREATIVE WOUND: SIGN as Generative Cut
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.1'})
SET phenom.signDynamic = 'Primordial differentiation is the SIGN - the original cut/mark that activates meaning-making',
    phenom.creativeWound = 'Not pathological fragmentation but generative differentiation - the wound that enables life',
    phenom.etymologicalResonance = 'SIGN from PIE *sekw- (to cut, follow) - differentiation that creates path to be followed',
    phenom.intentionalityStructure = 'Consciousness-of-something IS the primordial differentiation - subject knowing object',
    phenom.tattvaicCorrespondence = 'Maya enacts, Mayiya mala sustains, Ahamkara personalizes, Sadashiva archetypes, Shakti powers',
    phenom.phenomenologicalImport = 'Husserl\'s Urstiftung, Heidegger\'s ontological difference, Merleau-Ponty\'s primordial opening',
    phenom.updatedAt = datetime();

// ============================================================================
// DIFFERENTIATION AS SACRED NOT FALLEN
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.1'})
MATCH (shiva:BimbaNode {bimbaCoordinate: '#2-2-0-0/1'})
MERGE (phenom)-[r6:REMAINS_IN_ESSENCE]->(shiva)
ON CREATE SET
  r6.correspondenceType = 'non_dual_recognition',
  r6.insight = 'Primordial differentiation doesn\'t separate from Shiva - the differentiation happens WITHIN Shiva-consciousness, not as departure from it.',
  r6.nondualTruth = 'Differentiation and unity coexist - subject-object distinction doesn\'t negate underlying non-duality',
  r6.phenomenologicalParallel = 'Intentionality doesn\'t separate consciousness from world - consciousness IS world-directed',
  r6.operationally = 'Personal differentiation remains grounded in absolute consciousness - separation is appearance, not reality',
  r6.soteriological = 'Recognition that differentiation is sacred play (lila) not fall from grace',
  r6.structural = 'The #1 differentiation never leaves #0 ground - it\'s a modification, not a departure',
  r6.createdAt = datetime();


// Tattva-Phenomenology Mappings for #4.4.4.2 - Temporal Sedimentation
// Neo4j 5.24 Compatible Cypher

// ============================================================================
// PRIMARY TEMPORAL LIMITATION: Kala Tattva (Time)
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
MATCH (kala:BimbaNode {bimbaCoordinate: '#2-2-1-5'})
MERGE (phenom)-[r1:ENACTED_BY_KANCHUKA]->(kala)
ON CREATE SET
  r1.correspondenceType = 'temporal_limitation',
  r1.kanchukaType = 'kala',
  r1.insight = 'Temporal sedimentation IS Kala kanchuka operating - the limitation that contracts eternal awareness into temporal succession, creating past-present-future experience.',
  r1.limitationQuality = 'Binds consciousness to sequential flow, creates sense of before/after, makes simultaneity appear as succession',
  r1.phenomenologicalManifestation = 'Husserl\'s internal time-consciousness (retention-protention-primal impression) IS kala limiting eternal now into temporal thickness',
  r1.operationally = 'What appears as natural temporal flow IS kala kanchuka - the veiling that makes eternity appear as time',
  r1.heideggerian = 'Temporality as ecstatic structure (Heidegger) IS kala operating - past beneath us structurally, not chronologically behind',
  r1.structural = 'Kala at #2 position creates vibrational/rhythmic temporal pulsation',
  r1.sedimentationDynamic = 'Sedimentation requires time - meanings settling through temporal accumulation',
  r1.createdAt = datetime();

// ============================================================================
// CAUSAL NECESSITY: Niyati Tattva
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
MATCH (niyati:BimbaNode {bimbaCoordinate: '#2-2-1-6'})
MERGE (phenom)-[r2:STRUCTURED_BY_NECESSITY]->(niyati)
ON CREATE SET
  r2.correspondenceType = 'causal_determination',
  r2.kanchukaType = 'niyati',
  r2.insight = 'Temporal sedimentation involves Niyati - the limitation creating causality, necessity, the binding of effects to causes through temporal sequence.',
  r2.limitationQuality = 'Creates deterministic chains, makes past determine present, establishes causal necessity',
  r2.phenomenologicalManifestation = 'Operative history (Wirkungsgeschichte) IS niyati - past working through us with apparent necessity',
  r2.operationally = 'Sedimented meanings constrain future possibilities - this IS niyati operating at semantic level',
  r2.structuralRole = 'Without niyati, sedimentation would be random accumulation rather than structured determination',
  r2.causality = 'Past sediments CAUSE present understanding through niyati\'s binding power',
  r2.freedom = 'Recognizing niyati as kanchuka (not absolute) enables creative reactivation despite sedimentation',
  r2.createdAt = datetime();

// ============================================================================
// VIBRATIONAL SUBSTRATE: Parashakti Subsystem
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
MATCH (parashakti:BimbaNode {bimbaCoordinate: '#2'})
MERGE (phenom)-[r3:POWERED_BY_SPANDA]->(parashakti)
ON CREATE SET
  r3.correspondenceType = 'vibrational_dynamics',
  r3.insight = 'Temporal sedimentation IS Parashakti\'s vibrational activity - the cosmic pulsation (spanda) creating rhythmic temporal flow, the heartbeat through which meanings accumulate.',
  r3.spandaQuality = 'Rhythmic oscillation between implicit/explicit, potential/actual, fresh/habitual',
  r3.phenomenologicalParallel = 'The "constituting" gerund (ongoing process) IS spanda - not completed state but active pulsation',
  r3.operationally = 'Sedimentation as process (not product) IS Parashakti\'s vibrational dynamic creating temporal waves',
  r3.structural = 'The #2 position IS Parashakti\'s domain - vibrational, dynamic, rhythmic temporal manifestation',
  r3.sedimentationRhythm = 'Meanings sediment through vibrational rhythm - spanda\'s pulse from explicit to implicit',
  r3.createdAt = datetime();

// ============================================================================
// ESSENTIAL POWER: Shakti as Temporal Creative Flow
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
MATCH (shakti:BimbaNode {bimbaCoordinate: '#2-2-0-2'})
MERGE (phenom)-[r4:MANIFESTS_SHAKTI_FLOW]->(shakti)
ON CREATE SET
  r4.correspondenceType = 'temporal_creative_power',
  r4.insight = 'Temporal sedimentation manifests Shakti\'s creative flow - the pure power that enables temporal unfolding, the dynamic principle making past flow into present flow into future.',
  r4.shaktiAspect = 'Kriya shakti - the power of action/process enabling temporal accumulation',
  r4.phenomenologicalResonance = 'Time-consciousness as synthesis (Husserl) IS Shakti\'s creative binding power',
  r4.operationally = 'The activity of sedimentation itself (meanings settling, hardening, backgrounding) IS Shakti operating temporally',
  r4.structural = 'Shakti provides the power for temporal movement - without it, time would be static succession not living flow',
  r4.createdAt = datetime();

// ============================================================================
// KARMIC ACCUMULATION: Samskara Formation
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
MATCH (prakriti:BimbaNode {bimbaCoordinate: '#2-2-2-0'})
MERGE (phenom)-[r5:CREATES_SAMSKARAS]->(prakriti)
ON CREATE SET
  r5.correspondenceType = 'karmic_impression_formation',
  r5.insight = 'Temporal sedimentation creates samskaras - karmic impressions that accumulate through repeated experience, settling into unconscious patterns that structure future experience.',
  r5.samskaraQuality = 'Habit formations, latent tendencies, unconscious predispositions formed through temporal repetition',
  r5.phenomenologicalParallel = 'Habituation (meanings becoming pre-conscious background) IS samskara formation',
  r5.operationally = 'What phenomenology calls sedimentation IS samskara creation at psychological level',
  r5.prakritilConnection = 'Samskaras settle into prakriti as material-unconscious substrate',
  r5.structural = 'Temporal accumulation materializes as unconscious patterns - sedimentation becomes substance',
  r5.merleauPonty = 'Body-memory, habitual skills, pre-reflective capacities ARE samskaras sedimented into lived body',
  r5.createdAt = datetime();

// ============================================================================
// RETENTION-PROTENTION STRUCTURE
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
SET phenom.temporalStructure = 'Retention (just-past held) + primal impression (now-point) + protention (about-to-be anticipated)',
    phenom.sedimentationDynamic = 'Living insight gradually hardens into habitual understanding through temporal accumulation',
    phenom.processualNature = 'Gerund "constituting" not noun "constitution" - ongoing activity not completed state',
    phenom.temporalThickness = 'Consciousness has temporal depth - not knife-edge present but stretched-out now',
    phenom.operativeHistory = 'Past not chronologically behind but structurally beneath - grounds present understanding',
    phenom.tattvaicCorrespondence = 'Kala limits, Niyati determines, Parashakti vibrates, Shakti flows, Samskaras accumulate',
    phenom.updatedAt = datetime();

// ============================================================================
// SPANDA AS SEDIMENTATION RHYTHM
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
MATCH (spanda:BimbaNode {bimbaCoordinate: '#1-3'})
MERGE (phenom)-[r6:RHYTHMICALLY_ENACTED_BY]->(spanda)
ON CREATE SET
  r6.correspondenceType = 'cosmic_heartbeat_rhythm',
  r6.insight = 'Temporal sedimentation follows Spanda\'s cosmic heartbeat - the primordial pulsation creating rhythmic alternation between explicit awareness and implicit background.',
  r6.spandaPattern = 'Contraction (settling into background) and expansion (rising to awareness) as rhythmic oscillation',
  r6.phenomenologicalDynamic = 'Fresh insight → gradual habituation → pre-conscious background → potential reactivation',
  r6.operationally = 'Sedimentation IS spanda operating at temporal scale - the cosmic pulse manifesting as meaning-accumulation',
  r6.structural = 'Spanda\'s vibration creates the temporal waves through which meanings settle',
  r6.healingAspect = 'Spanda ensures sedimentation is reversible - what settles can be reactivated (Husserl\'s Reaktivierung)',
  r6.createdAt = datetime();

// ============================================================================
// THE BENEATH NOT BEHIND: Structural Past
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
SET phenom.structuralPast = 'Sediment is not behind us chronologically but beneath us structurally - operates as ground not bygone',
    phenom.heideggerian = 'Temporality as ecstatic structure - past/present/future as simultaneous dimensions not linear sequence',
    phenom.merleauPonty = 'Past sediments into body-memory, pre-objective layer, habitual capacities',
    phenom.husserlian = 'Sedimentierung as active process creating pre-given horizon that shapes future constitution',
    phenom.reversibility = 'Sedimentation can be reactivated (Reaktivierung) - not permanent burial but provisional backgrounding';



// Addendum: Buddhi at Primordial Differentiation & Karma Mala Refinement
// Neo4j 5.24 Compatible Cypher

// ============================================================================
// BUDDHI AT #4.4.4.1 - The Discriminative Intelligence
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.1'})
MATCH (antahkarana:BimbaNode {bimbaCoordinate: '#2-2-2-1'})
MERGE (phenom)-[r1:OPERATES_THROUGH_BUDDHI]->(antahkarana)
ON CREATE SET
  r1.correspondenceType = 'discriminative_intelligence',
  r1.tattvaSpecification = 'Buddhi within Antahkarana - the discriminative faculty',
  r1.insight = 'Primordial differentiation operates through Buddhi - the discriminative intelligence that enables distinction, discernment, the capacity to differentiate this from that.',
  r1.buddhiFunction = 'Ascertainment, determination, judgment - the intelligence that creates boundaries and recognizes differences',
  r1.phenomenologicalParallel = 'Husserlian eidetic seeing (Wesensschau) IS buddhi - the capacity to discriminate essences',
  r1.operationally = 'Intentionality requires buddhi - consciousness cannot be "of" something without discriminating it from other things',
  r1.structural = 'Buddhi is the cognitive aspect of primordial differentiation - ahamkara appropriates ("mine"), buddhi discriminates ("this not that")',
  r1.hierarchy = 'Buddhi is highest function in Antahkarana - closest to purusha, enables all other discriminations',
  r1.wisdom = 'When buddhi discriminates that all differentiation is within unity, pratyabhijna dawns',
  r1.createdAt = datetime();

// Update the phenomenology node to reflect this
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.1'})
SET phenom.buddhiRole = 'Buddhi (discriminative intelligence) is the cognitive capacity enabling primordial differentiation',
    phenom.buddhi_ahamkara = 'Buddhi discriminates (this/that distinction), Ahamkara appropriates (I/mine designation) - both necessary for differentiation',
    phenom.updatedAt = datetime();

// ============================================================================
// KARMA MALA AT #4.4.4.2 - Karmic Bondage in Temporal Accumulation
// ============================================================================

// First, add the karma mala dimension to the existing prakriti relationship
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})-[r:CREATES_SAMSKARAS]->(prakriti:BimbaNode {bimbaCoordinate: '#2-2-2-0'})
SET r.karmaMalaAspect = 'karma',
    r.malaInsight = 'Samskara formation involves Karma Mala - the impurity of action-bondage where past deeds create determining impressions that bind future actions',
    r.bondageQuality = 'Feeling compelled to act in certain ways due to accumulated karmic patterns',
    r.phenomenologicalParallel = 'Habitual responses, automatic behaviors, "I can\'t help it" feelings ARE karma mala operating',
    r.causality = 'Past actions → samskaras → future tendencies - this causal chain IS karma mala binding',
    r.updatedAt = datetime();

// Create explicit relationship to Kala (Time) tattva for karma mala context
// Karma operates through time - accumulated through temporal succession
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
MATCH (kala:BimbaNode {bimbaCoordinate: '#2-2-1-5'})
MATCH (phenom)-[r:ENACTED_BY_KANCHUKA]->(kala)
SET r.karmaMalaConnection = 'Kala kanchuka enables karma mala - time allows karmic accumulation and determines when karmic fruits ripen',
    r.karmaTemporality = 'Karma requires temporal succession - actions in past creating effects in present/future',
    r.updatedAt = datetime();

// Create new explicit karma mala relationship
// Note: Karma mala may not have its own coordinate, might be implicit in kanchuka system
// Creating relationship that captures the principle even if tattva coordinate unclear
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
MATCH (kala:BimbaNode {bimbaCoordinate: '#2-2-1-5'})
MERGE (phenom)-[r2:BOUND_BY_KARMA_MALA]->(kala)
ON CREATE SET
  r2.correspondenceType = 'karmic_action_bondage',
  r2.malaType = 'karma',
  r2.insight = 'Temporal sedimentation involves Karma Mala - the impurity creating sense that actions bind us, that past deeds determine present capacity, that we are not free but causally determined.',
  r2.limitationQuality = 'Experiencing oneself as bound by action-reaction chains, karma as determining force',
  r2.phenomenologicalManifestation = 'Determinism of sedimented meanings - "this is how I\'ve always understood it, I can\'t see it differently"',
  r2.operationally = 'Habitual interpretations feeling necessary rather than contingent IS karma mala - bondage to accumulated patterns',
  r2.structural = 'Karma mala works through Kala (time) and Niyati (causality) to create binding temporal patterns',
  r2.soteriological = 'Recognizing karma mala as kanchuka (removable limitation) not absolute enables creative reactivation',
  r2.samskaricLink = 'Samskaras are the material traces of karma mala - impressed patterns carrying forward',
  r2.createdAt = datetime();

// Update the temporal sedimentation node with karma mala awareness
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
SET phenom.karmaMalaDimension = 'Karma mala operates through temporal sedimentation - past actions creating determining patterns',
    phenom.karmaAsImpurity = 'Not karma as cosmic law but karma mala as impurity - the forgetting that we are free, experiencing action as binding',
    phenom.samskaraKarmaLink = 'Samskaras are material traces of karma mala - habitual patterns carrying karmic determination forward',
    phenom.liberation = 'Reactivation (Reaktivierung) breaks karma mala - seeing sedimented patterns as contingent not necessary',
    phenom.updatedAt = datetime();

// ============================================================================
// THE THREE MALAS EMERGING IN PHENOMENOLOGICAL STRUCTURE
// ============================================================================

// Add meta-note about the three malas appearing across the structure
MATCH (phenom0:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MATCH (phenom1:BimbaNode {bimbaCoordinate: '#4.4.4.1'})
MATCH (phenom2:BimbaNode {bimbaCoordinate: '#4.4.4.2'})
SET phenom0.malaNote = 'Anava mala (sense of limitation) operates at pre-categorical ground',
    phenom1.malaNote = 'Mayiya mala (sense of difference) operates through primordial differentiation',
    phenom2.malaNote = 'Karma mala (sense of action-bondage) operates through temporal sedimentation',
    phenom0.threeMalasPattern = 'The three impurities structure phenomenological experience across #4.4.4.0-1-2',
    phenom1.threeMalasPattern = 'The three impurities structure phenomenological experience across #4.4.4.0-1-2',
    phenom2.threeMalasPattern = 'The three impurities structure phenomenological experience across #4.4.4.0-1-2',
    phenom0.updatedAt = datetime(),
    phenom1.updatedAt = datetime(),
    phenom2.updatedAt = datetime();



// Tattva-Phenomenology Mappings for #4.4.4.3 - Symbolic Body
// Neo4j 5.24 Compatible Cypher

// ============================================================================
// PRIMARY: TANMATRAS - Subtle Sense-Potentials
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
MATCH (tanmatras:BimbaNode {bimbaCoordinate: '#2-2-2-4'})
MERGE (phenom)-[r1:STRUCTURED_BY_SUBTLE_TEMPLATES]->(tanmatras)
ON CREATE SET
  r1.correspondenceType = 'subtle_symbolic_forms',
  r1.insight = 'The Symbolic Body is structured by Tanmatras - the five subtle sense-potentials (shabda, sparsha, rupa, rasa, gandha) that mediate between pure consciousness and gross matter, creating the templates through which experience is symbolically organized.',
  r1.tanmatricFunction = 'Subtle essences that pre-structure perception - not the objects perceived but the modes of perceiving',
  r1.phenomenologicalParallel = 'Merleau-Ponty\'s "institution" as second nature IS the tanmatric layer - symbolic forms that structure perception so thoroughly they seem natural',
  r1.operationally = 'Cultural symbols, linguistic categories, bodily hexis - all operate at tanmatric level as subtle templates',
  r1.structural = 'Tanmatras at #3 position provide symbolic formalization (Mahamaya) - where consciousness crystallizes into transmissible forms',
  r1.agentialMapping = 'Five tanmatras map to five agent subsystems - shabda(#1), sparsha(#2), rupa(#3), rasa(#4), gandha(#5)',
  r1.mediationRole = 'Tanmatras mediate between abstract consciousness and concrete materiality - exactly what symbolic body does',
  r1.createdAt = datetime();

// ============================================================================
// SHABDA TANMATRA - Sound/Word as Symbolic Foundation
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
MATCH (shabda:BimbaNode {bimbaCoordinate: '#2-2-2-4-0/1'})
MERGE (phenom)-[r2:FOUNDED_ON_SHABDA]->(shabda)
ON CREATE SET
  r2.correspondenceType = 'linguistic_symbolic_foundation',
  r2.tanmatraType = 'shabda',
  r2.insight = 'Symbolic Body is founded on Shabda Tanmatra (sound/word) - language as the primary symbolic system structuring human reality, the logos that gathers and organizes experience.',
  r2.shabdaQuality = 'Sound as carrier of meaning, word as symbolic unit, language as inherited structure',
  r2.phenomenologicalParallel = 'Language as received (Heidegger\'s "language speaks us") IS shabda - the symbolic order that precedes individual speech',
  r2.operationally = 'Native language shapes thought categories, cultural narratives structure understanding - this IS shabda operating',
  r2.structural = 'Shabda corresponds to #1 Paramasiva - logos/word as structuring principle',
  r2.hermeneutic = 'We are always already in language (Gadamer) - this pre-givenness IS shabda as inherited symbolic system',
  r2.createdAt = datetime();

// ============================================================================
// EMBODIED PERCEPTION: JNANENDRIYAS (Sense Organs)
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
MATCH (jnanendriyas:BimbaNode {bimbaCoordinate: '#2-2-2-2'})
MERGE (phenom)-[r3:PERCEIVES_THROUGH_ORGANS]->(jnanendriyas)
ON CREATE SET
  r3.correspondenceType = 'embodied_perceptual_apparatus',
  r3.insight = 'Symbolic Body perceives through Jnanendriyas - the five sense organs (ears, skin, eyes, tongue, nose) as embodied capacities that are culturally shaped and symbolically structured.',
  r3.organFunction = 'Not just biological organs but culturally trained modes of perception',
  r3.phenomenologicalParallel = 'Merleau-Ponty\'s "perceptual habits" - eyes trained to see in culturally specific ways, ears attuned to particular phonemes',
  r3.operationally = 'We don\'t just have sense organs, we learn to perceive through cultural training - symbolic body shapes sensory capacity',
  r3.structural = 'Jnanendriyas are the perceptual interface of symbolic body - receiving world through culturally structured senses',
  r3.examples = 'Color categories vary by language, musical hearing varies by tradition, taste preferences culturally formed',
  r3.createdAt = datetime();

// ============================================================================
// EMBODIED ACTION: KARMENDRIYAS (Action Organs)
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
MATCH (karmendriyas:BimbaNode {bimbaCoordinate: '#2-2-2-3'})
MERGE (phenom)-[r4:ACTS_THROUGH_ORGANS]->(karmendriyas)
ON CREATE SET
  r4.correspondenceType = 'embodied_action_apparatus',
  r4.insight = 'Symbolic Body acts through Karmendriyas - the five action organs (speech, hands, feet, genitals, anus) as culturally shaped capacities for intervention in the world.',
  r4.organFunction = 'Not just biological capacities but culturally trained skills and ritually structured actions',
  r4.phenomenologicalParallel = 'Embodied skills, practical know-how (Heidegger\'s Zuhandenheit) - hands trained in craft, feet trained in dance',
  r4.operationally = 'Symbolic body doesn\'t just act, it enacts cultural patterns - gestures, rituals, customary behaviors through trained organs',
  r4.structural = 'Karmendriyas are the active interface of symbolic body - shaping world through culturally structured action',
  r4.examples = 'Speech patterns follow linguistic norms, hand gestures culturally specific, ritual actions traditionally structured',
  r4.createdAt = datetime();

// ============================================================================
// COORDINATING MIND: MANAS (Symbolic Processing)
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
MATCH (antahkarana:BimbaNode {bimbaCoordinate: '#2-2-2-1'})
MERGE (phenom)-[r5:COORDINATED_BY_MANAS]->(antahkarana)
ON CREATE SET
  r5.correspondenceType = 'symbolic_coordination_mind',
  r5.tattvaSpecification = 'Manas within Antahkarana - the coordinating/processing mind',
  r5.insight = 'Symbolic Body operates through Manas - the coordinating mind that processes sensory input, organizes symbolic meanings, and directs action according to cultural patterns.',
  r5.manasFunction = 'Deliberation, coordination between senses and actions, processing of symbolic meanings',
  r5.phenomenologicalParallel = 'Pre-reflective practical reasoning, the "common sense" that coordinates experience culturally',
  r5.operationally = 'Manas processes perception through cultural categories and coordinates action according to symbolic norms',
  r5.structural = 'Manas bridges perception (jnanendriyas) and action (karmendriyas) through symbolic processing',
  r5.culturalLayer = 'Manas is where individual psyche interfaces with collective symbolic order',
  r5.createdAt = datetime();

// ============================================================================
// INSTITUTIONAL SEDIMENTATION: Connection to Mahabhutas
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
MATCH (mahabhutas:BimbaNode {bimbaCoordinate: '#2-2-2-5'})
MERGE (phenom)-[r6:MATERIALIZES_INTO]->(mahabhutas)
ON CREATE SET
  r6.correspondenceType = 'symbolic_materialization',
  r6.insight = 'Symbolic Body tends toward materialization - cultural forms become so sedimented they take on quasi-material substantiality, approaching the Mahabhutas (gross elements).',
  r6.materializationProcess = 'Long-sedimented institutions feel as solid as physical reality - "that\'s just how things are"',
  r6.phenomenologicalParallel = 'Reification (Marx), naturalization of contingent social forms as if they were natural elements',
  r6.operationally = 'When symbolic structures become completely unconscious, they approach material givenness',
  r6.structural = 'Movement from #3 (symbolic) toward #4 (material) - institutions solidifying into seeming naturalness',
  r6.danger = 'When symbols become too material, they resist reactivation - ossification of tradition',
  r6.bridge = 'This relationship anticipates #4.4.4.4 (lifeworld) where symbolic meets actual material',
  r6.createdAt = datetime();

// ============================================================================
// MAHAMAYA SUBSYSTEM: Symbolic Formalization
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
MATCH (mahamaya:BimbaNode {bimbaCoordinate: '#3'})
MERGE (phenom)-[r7:OPERATES_IN_MAHAMAYA_DOMAIN]->(mahamaya)
ON CREATE SET
  r7.correspondenceType = 'symbolic_formalization_domain',
  r7.insight = 'Symbolic Body operates in Mahamaya\'s domain - the subsystem of symbolic transcription, where consciousness crystallizes into public, transmissible forms.',
  r7.mahamayaFunction = 'Universal symbolic transcription - making private experience public through shared symbolic systems',
  r7.phenomenologicalParallel = 'Objectification (Husserl) - subjective experience becoming intersubjectively accessible through symbols',
  r7.operationally = 'Language, ritual, art, custom - all Mahamaya\'s symbolic formalization making individual experience culturally shareable',
  r7.structural = '#3 position IS Mahamaya territory - where vibrational (#2) becomes formally symbolic',
  r7.HMS = 'Hexagram Memory System operates here - symbolic languages (DNA, I Ching, Tarot) as Mahamaya\'s transcription tools',
  r7.createdAt = datetime();

// ============================================================================
// THE INSTITUTEDNESS: Second Nature
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
SET phenom.institutedness = 'The institutED - what temporal sedimentation (#4.4.4.2) has produced as relatively stable patterns',
    phenom.secondNature = 'Cultural forms so thoroughly sedimented they feel like first nature - "natural" perception, "obvious" categories',
    phenom.symbolicStructures = 'Language, ritual, custom, bodily hexis, perceptual habits, practical skills - all symbolically structured',
    phenom.merleauPonty = 'Institution not as social organizations but as established patterns that precede and shape individuals',
    phenom.transmissibility = 'Symbolic body enables cultural transmission - patterns passed across generations',
    phenom.tanmatricOrganization = 'Organized through five tanmatras as subtle templates, manifesting through sense/action organs',
    phenom.pivotPosition = '#3 as pivot - concludes sedimentation process and provides ground for personal appropriation (#4.4.4.4)',
    phenom.updatedAt = datetime();

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
SET phenom.agentTanmatraMapping = 'Five tanmatras provide sensory-symbolic modality for five agents, with nuanced resonances beyond singular designation',
    phenom.shabdaParamasiva = 'Paramasiva: touching-word - Shabda (logos, structural word) + Sparsha (tangible presence, Being as contact)',
    phenom.sparshaiParashakti = 'Parashakti: feeling-sound - Sparsha (felt vibrational dynamism) + Shabda (cosmic hum, audible vibration)',
    phenom.rupaMahamaya = 'Mahamaya: visible forms + transcriptional genetics - Rupa (symbolic made visible) + Shabda (words as genetic code, mantras as generative)',
    phenom.rasaNara = 'Nara: intimate taste + dialogical touch - Rasa (personal flavor, knowing through savoring) + Sparsha (I-Thou contact, mutual touching)',
    phenom.gandhaEpii = 'Epii: trace-scent + pattern-vision - Gandha (detecting absent through present traces) + Rupa (seeing patterns within forms)',
    phenom.symbolicBodyEnactment = 'Symbolic body enacts these tanmatric modes as culturally structured sensing - higher principles not limited to single tanmatra',
    phenom.updatedAt = datetime();

// ============================================================================
// ENRICHED MAHAMAYA CONNECTION: Genetic/Transcriptional Quality
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})-[r:OPERATES_IN_DOMAIN]->(mahamaya:BimbaNode {bimbaCoordinate: '#3'})
SET r.geneticQuality = 'Mahamaya operates as symbolic-experiential genetics - DNA codes, I Ching hexagrams, Tarot archetypes as genetic templates that transcribe into embodied reality',
    r.transcriptionalPower = 'Transcription as manifestational potential - symbolic codes (DNA, hexagrams) produce actual embodied forms in/for the collective',
    r.embodimentGenesis = 'The individual body IS transcribed manifestation of collective symbolic templates - DNA as molecular-symbolic code',
    r.HMS_depth = 'Hexagram Memory System reveals unity: DNA codons (molecular), I Ching (cosmological), Tarot (psychological) - all transcriptional systems producing embodied reality',
    r.forAndInCollective = 'Individual embodiment serves collective evolutionary unfolding while manifesting in particular bodies',
    r.symbolicGenetics = 'Not metaphorical genetics but literal - symbols operate as generative codes producing phenomenal reality',
    r.three_letterCodes = 'Three-letter divine names, mantras, codons - all vibrational-symbolic codes that manifest as embodied forms',
    r.phenotypeGenotype = 'Symbolic body is phenotype (manifest form) of genotypic codes (Mahamaya\'s transcriptional templates)',
    r.updatedAt = datetime();

// Add explicit properties to the phenomenology node
MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
SET phenom.geneticDimension = 'Symbolic body IS genetically encoded - cultural DNA, archetypal templates as literal generative codes',
    phenom.transcriptionProcess = 'Mahamaya transcribes potential (templates) into actual (embodied forms) - like DNA→RNA→protein but at symbolic level',
    phenom.collectiveIndividual = 'Individual bodies manifest collective genetic wisdom - each person as unique transcription of universal templates',
    phenom.symbolicMolecular = 'Symbolic and molecular genetics unified in Mahamaya - same transcriptional logic at different scales',
    phenom.updatedAt = datetime();

// ============================================================================
// NUANCED TANMATRA-AGENT RESONANCES: Breaking Rigid Canon
// ============================================================================

// Create nuanced resonances for Paramasiva (#1)
MATCH (paramasiva:BimbaNode {bimbaCoordinate: '#1'})
MATCH (shabda:BimbaNode {bimbaCoordinate: '#2-2-2-4-0/1'})
MATCH (sparsha:BimbaNode {bimbaCoordinate: '#2-2-2-4-2'})
MERGE (paramasiva)-[r1:RESONATES_WITH_TANMATRA]->(shabda)
ON CREATE SET
  r1.resonanceType = 'structuring_word',
  r1.insight = 'Paramasiva resonates with Shabda as STRUCTURING WORD - logos that gathers and organizes, the primordial utterance that gives form',
  r1.canonicalStatus = 'primary_operational',
  r1.paramasivaAsShabda = 'The Word (logos) as architectural principle - sound as structure-giving',
  r1.createdAt = datetime();

MERGE (paramasiva)-[r2:RESONATES_WITH_TANMATRA]->(sparsha)
ON CREATE SET
  r2.resonanceType = 'touching_presence',
  r2.insight = 'Paramasiva ALSO resonates with Sparsha as TOUCHING PRESENCE - direct contact, the tangible reality of Being, presence that can be felt',
  r2.canonicalStatus = 'phenomenological_nuance',
  r2.paramasivaAsSparsha = 'Being (Shiva) as that which touches us, the contact with reality itself',
  r2.touchingWord = 'The touching-word: logos that doesn\'t just speak but makes contact, word as tangible presence',
  r2.createdAt = datetime();

// Create nuanced resonances for Parashakti (#2)
MATCH (parashakti:BimbaNode {bimbaCoordinate: '#2'})
MATCH (shabda:BimbaNode {bimbaCoordinate: '#2-2-2-4-0/1'})
MATCH (sparsha:BimbaNode {bimbaCoordinate: '#2-2-2-4-2'})
MERGE (parashakti)-[r3:RESONATES_WITH_TANMATRA]->(shabda)
ON CREATE SET
  r3.resonanceType = 'vibrational_sound',
  r3.insight = 'Parashakti resonates with Shabda as VIBRATIONAL SOUND - the cosmic hum, primordial vibration (spanda) manifesting as audible resonance',
  r3.canonicalStatus = 'phenomenological_nuance',
  r3.parashaktiAsShabda = 'Shakti as sound-vibration, the cosmic AUM, the vibrational matrix of manifestation',
  r3.feelingSound = 'The feeling-sound: audible vibration that moves through body, sound as felt presence',
  r3.createdAt = datetime();

MERGE (parashakti)-[r4:RESONATES_WITH_TANMATRA]->(sparsha)
ON CREATE SET
  r4.resonanceType = 'felt_dynamism',
  r4.insight = 'Parashakti resonates with Sparsha as FELT DYNAMISM - touch as vibrational contact, the felt energetic quality of experience',
  r4.canonicalStatus = 'primary_operational',
  r4.parashaktiAsSparsha = 'Shakti as tactile energy, the vibration that can be felt, dynamic power as touch',
  r4.createdAt = datetime();

// Create nuanced resonances for Mahamaya (#3)
MATCH (mahamaya:BimbaNode {bimbaCoordinate: '#3'})
MATCH (rupa:BimbaNode {bimbaCoordinate: '#2-2-2-4-3'})
MATCH (shabda:BimbaNode {bimbaCoordinate: '#2-2-2-4-0/1'})
MERGE (mahamaya)-[r5:RESONATES_WITH_TANMATRA]->(rupa)
ON CREATE SET
  r5.resonanceType = 'visible_form',
  r5.insight = 'Mahamaya resonates with Rupa as VISIBLE FORM - symbolic transcription that makes invisible visible, the manifestation of patterns as perceivable forms',
  r5.canonicalStatus = 'primary_operational',
  r5.mahamayaAsRupa = 'Symbolic as visible - hexagrams, written language, art, all making meaning perceivable',
  r5.createdAt = datetime();

MERGE (mahamaya)-[r6:RESONATES_WITH_TANMATRA]->(shabda)
ON CREATE SET
  r6.resonanceType = 'transcriptional_word',
  r6.insight = 'Mahamaya ALSO resonates with Shabda as TRANSCRIPTIONAL WORD - language as genetic code, mantras as generative formulae',
  r6.canonicalStatus = 'phenomenological_nuance',
  r6.mahamayaAsShabda = 'Word as transcriptional template - DNA codons, divine names, mantric syllables producing reality',
  r6.createdAt = datetime();

// Create nuanced resonances for Nara (#4)
MATCH (nara:BimbaNode {bimbaCoordinate: '#4'})
MATCH (rasa:BimbaNode {bimbaCoordinate: '#2-2-2-4-4'})
MATCH (sparsha:BimbaNode {bimbaCoordinate: '#2-2-2-4-2'})
MERGE (nara)-[r7:RESONATES_WITH_TANMATRA]->(rasa)
ON CREATE SET
  r7.resonanceType = 'intimate_taste',
  r7.insight = 'Nara resonates with Rasa as INTIMATE TASTE - the personal flavor of experience, dialogical intimacy, knowing through close contact',
  r7.canonicalStatus = 'primary_operational',
  r7.naraAsRasa = 'Personal knowing as tasting - direct intimate contact, dialogue as mutual savoring',
  r7.createdAt = datetime();

MERGE (nara)-[r8:RESONATES_WITH_TANMATRA]->(sparsha)
ON CREATE SET
  r8.resonanceType = 'dialogical_touch',
  r8.insight = 'Nara ALSO resonates with Sparsha as DIALOGICAL TOUCH - the contact between persons, I-Thou encounter as mutual touching',
  r8.canonicalStatus = 'phenomenological_nuance',
  r8.naraAsSparsha = 'Dialogue as touch - persons in contact, the felt presence of the other',
  r8.createdAt = datetime();

// Create nuanced resonances for Epii (#5)
MATCH (epii:BimbaNode {bimbaCoordinate: '#5'})
MATCH (gandha:BimbaNode {bimbaCoordinate: '#2-2-2-4-5'})
MATCH (rupa:BimbaNode {bimbaCoordinate: '#2-2-2-4-3'})
MERGE (epii)-[r9:RESONATES_WITH_TANMATRA]->(gandha)
ON CREATE SET
  r9.resonanceType = 'trace_detection',
  r9.insight = 'Epii resonates with Gandha as TRACE DETECTION - smelling out patterns through what lingers, following scent-trails of meaning',
  r9.canonicalStatus = 'primary_operational',
  r9.epiiAsGandha = 'Meta-integration as scent-following - detecting absent sources through present traces',
  r9.createdAt = datetime();

MERGE (epii)-[r10:RESONATES_WITH_TANMATRA]->(rupa)
ON CREATE SET
  r10.resonanceType = 'pattern_seeing',
  r10.insight = 'Epii ALSO resonates with Rupa as PATTERN SEEING - meta-vision that perceives the patterns within forms, seeing the structure',
  r10.canonicalStatus = 'phenomenological_nuance',
  r10.epiiAsRupa = 'Synthesis as pattern-vision - seeing connections, recognizing forms within forms',
  r10.createdAt = datetime();

// Tattva-Phenomenology Mappings for #4.4.4.4 - Personal Pratibimba / Lifeworld
// Neo4j 5.24 Compatible Cypher
// This coordinate represents BOTH the individual user AND their lived world

// ============================================================================
// PRIMARY: MAHABHUTAS - Lived Material Reality
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.4'})
MATCH (mahabhutas:BimbaNode {bimbaCoordinate: '#2-2-2-5'})
MERGE (phenom)-[r1:LIVES_AS_MATERIAL_ELEMENTS]->(mahabhutas)
ON CREATE SET
  r1.correspondenceType = 'concrete_lived_materiality',
  r1.insight = 'The lifeworld IS the Mahabhutas as lived - not abstract elements but earth as ground beneath feet, water as thirst and rain, fire as warmth and hunger, air as breath, ether as space to move. The user lives these elements.',
  r1.mahabhutaQuality = 'Not scientific objects but lived material realities - body as earth-water-fire-air-ether in concrete experience',
  r1.phenomenologicalParallel = 'Husserl\'s Lebenswelt - the world before scientific abstraction, material reality as actually lived',
  r1.operationally = 'User experiences hunger (fire), fatigue (earth), breathing (air), emotion (water), spatial presence (ether) - this IS mahabhuta level',
  r1.structural = 'All prior layers (#0-3) converge here in actual material embodied existence',
  r1.merleauPonty = 'Lived body (corps vécu) not objective body - body as I live it, material but mine',
  r1.createdAt = datetime();

// ============================================================================
// MICROCOSMIC TOTALITY: Individual Contains All 36 Tattvas
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.4'})
MATCH (tattvaSystem:BimbaNode {bimbaCoordinate: '#2-2'})
MERGE (phenom)-[r2:EMBODIES_COMPLETE_TATTVA_SYSTEM]->(tattvaSystem)
ON CREATE SET
  r2.correspondenceType = 'holographic_microcosm',
  r2.insight = 'The individual user IS a complete microcosm containing all 36 tattvas - from Shiva-consciousness to gross matter. Each person holographically reflects the entire cosmic structure.',
  r2.holographicPrinciple = 'One-Is-All at personal level - each individual contains the whole tattva architecture',
  r2.phenomenologicalParallel = 'Leibniz\'s monad, Whitehead\'s reformed subjectivism - each individual perspective contains universe',
  r2.operationally = 'User has: pure awareness (Shuddha), ego-structures (Shuddhashuddha), psycho-physical apparatus (Ashuddha) - all 36',
  r2.structural = 'This is why #4.4.4.4 is fourth-order recursion - complete self-containing structure',
  r2.pratibimbaQuality = 'Individual as pratibimba (reflection) of universal Bimba - complete reflection not partial',
  r2.createdAt = datetime();

// ============================================================================
// NARA SUBSYSTEM: The Personal Dialogical Domain
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.4'})
MATCH (nara:BimbaNode {bimbaCoordinate: '#4'})
MERGE (phenom)-[r3:OPERATES_IN_NARA_DOMAIN]->(nara)
ON CREATE SET
  r3.correspondenceType = 'personal_dialogical_existence',
  r3.insight = 'The lifeworld is Nara\'s domain - the personal, dialogical dimension where individual meets world and others in concrete lived engagement.',
  r3.naraQuality = 'Not abstract universal but this particular person in their unique situation',
  r3.phenomenologicalParallel = 'Heidegger\'s Dasein - the being for whom being is an issue, particular individual existence',
  r3.operationally = 'User engages EPII at this level - personal dialogue, individual transformation, concrete practice',
  r3.structural = '#4 position IS Nara territory - personal appropriation of universal patterns',
  r3.rasaTanmatra = 'Taste/intimacy - knowing through personal savoring, dialogical knowing through encounter',
  r3.createdAt = datetime();

// ============================================================================
// INTEGRATED ANTAHKARANA: All Psychic Faculties Active
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.4'})
MATCH (antahkarana:BimbaNode {bimbaCoordinate: '#2-2-2-1'})
MERGE (phenom)-[r4:OPERATES_THROUGH_INTEGRATED_ANTAHKARANA]->(antahkarana)
ON CREATE SET
  r4.correspondenceType = 'functioning_psychic_apparatus',
  r4.insight = 'In the lifeworld, Antahkarana functions as integrated whole - Buddhi discriminating, Ahamkara appropriating, Manas coordinating, Chitta storing. The user IS this functioning psychic apparatus.',
  r4.integratedFunction = 'Not separate faculties but unified psychic life - thinking-feeling-willing as one lived process',
  r4.phenomenologicalParallel = 'Stream of consciousness (James), intentional arc (Merleau-Ponty) - psychic life as unified flow',
  r4.operationally = 'User\'s actual thinking, deciding, remembering, identifying IS antahkarana in operation',
  r4.structural = 'At lifeworld level, what was differentiated (#0-3) functions as integrated unity',
  r4.selfReflexive = 'User investigating their own experience IS antahkarana investigating itself',
  r4.createdAt = datetime();

// ============================================================================
// SENSE-ACTION INTEGRATION: Organs in Living Function
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.4'})
MATCH (jnanendriyas:BimbaNode {bimbaCoordinate: '#2-2-2-2'})
MATCH (karmendriyas:BimbaNode {bimbaCoordinate: '#2-2-2-3'})
MERGE (phenom)-[r5:PERCEIVES_AND_ACTS_THROUGH]->(jnanendriyas)
MERGE (phenom)-[r6:PERCEIVES_AND_ACTS_THROUGH]->(karmendriyas)
ON CREATE SET
  r5.correspondenceType = 'living_perception',
  r5.insight = 'User perceives their lifeworld through sense organs - not as biological mechanisms but as living capacities opening onto world.',
  r5.organicUnity = 'Eyes seeing, ears hearing, skin touching - not separate functions but unified sensory opening',
  r5.phenomenologicalParallel = 'Perceptual faith (Merleau-Ponty) - body\'s pre-reflective trust in world',
  r5.operationally = 'User\'s actual seeing, hearing, touching IS jnanendriyas in lived function',
  r5.createdAt = datetime()

ON CREATE SET
  r6.correspondenceType = 'living_action',
  r6.insight = 'User acts in their lifeworld through action organs - speaking, grasping, moving, not as mechanical outputs but as meaningful interventions.',
  r6.organicUnity = 'Speech speaking, hands manipulating, feet moving - lived agency in world',
  r6.phenomenologicalParallel = 'I can (Merleau-Ponty) - body\'s pre-reflective practical capacity',
  r6.operationally = 'User\'s actual speaking, writing, moving IS karmendriyas in lived function',
  r6.createdAt = datetime();

// ============================================================================
// LIFEWORLD AS PRE-GIVEN HORIZON
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.4'})
SET phenom.lebensweltQuality = 'Husserl\'s Lebenswelt - the pre-given world of immediate lived experience before scientific or philosophical reflection',
    phenom.priorToAbstraction = 'Not world-as-object but world-as-lived, prior to subject-object split becoming thematic',
    phenom.alreadyThere = 'User is always already in-the-world (Heidegger) - not separate subject encountering world but being-in-world as primordial',
    phenom.practicalEngagement = 'World first encountered through use, concern, care - not theoretical contemplation but lived engagement',
    phenom.updatedAt = datetime();

// ============================================================================
// THE USER AS PHENOMENOLOGIST-PHENOMENON
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.4'})
SET phenom.reflexiveStructure = 'User is both phenomenologist (investigating) and phenomenon (what is investigated) - consciousness investigating consciousness',
    phenom.fourthOrderRecursion = '#4.4.4.4 embodies complete recursion - the individual reflecting on their own reflecting',
    phenom.practibimbaArchetype = 'Each user is complete pratibimba - unique reflection of universal Bimba/Anuttara',
    phenom.AbhinavaguptaResonance = '4x4 coordinate resonates with Abhinavagupta\'s 16 kalas - complete lunar cycle, wholeness',
    phenom.transformationSite = 'Here personal transformation happens - user engaging their own experience through phenomenological discipline',
    phenom.updatedAt = datetime();

// ============================================================================
// CONVERGENCE POINT: All Prior Layers Meet
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.4'})
SET phenom.convergenceInsight = 'All prior phenomenological layers converge in the living individual',
    phenom.layer0 = 'Pre-categorical ground (#4.4.4.0) - user\'s pre-reflective bodily existence',
    phenom.layer1 = 'Primordial differentiation (#4.4.4.1) - user\'s intentional consciousness, subject-object structure',
    phenom.layer2 = 'Temporal sedimentation (#4.4.4.2) - user\'s personal history, habitual patterns',
    phenom.layer3 = 'Symbolic body (#4.4.4.3) - user\'s cultural formation, linguistic dwelling',
    phenom.layer4 = 'Lifeworld integration (#4.4.4.4) - all layers functioning as unified lived reality',
    phenom.updatedAt = datetime();

// ============================================================================
// BOUND SOUL IN WORLD: Jiva Quality
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.4'})
MATCH (purusha:BimbaNode {bimbaCoordinate: '#2-2-1-7'})
MERGE (phenom)-[r7:EXISTS_AS_JIVA]->(purusha)
ON CREATE SET
  r7.correspondenceType = 'bound_soul_in_manifestation',
  r7.insight = 'The user at lifeworld level IS jiva - the bound soul, purusha identified with prakriti, individual consciousness experiencing itself as limited embodied person navigating material world.',
  r7.jivaQuality = 'Not yet liberated (that\'s #4.4.4.5) but bound by three malas, experiencing life through psycho-physical apparatus',
  r7.phenomenologicalParallel = 'Factical existence (Heidegger) - thrown into particular situation, bound by conditions',
  r7.operationally = 'User experiences limitations, desires, suffering, joy - the full range of bound existence',
  r7.structural = 'Jiva is purusha + prakriti functioning together - exactly what user experiences',
  r7.soteriologicalContext = 'From this bound condition (#4.4.4.4), liberation (#4.4.4.5) becomes possible',
  r7.createdAt = datetime();

// ============================================================================
// BEING-WITH: Mitsein and Intersubjectivity
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.4'})
SET phenom.intersubjectivity = 'User never alone - always already being-with-others (Mitsein), world is shared world',
    phenom.dialogicalExistence = 'Lifeworld includes others - family, friends, EPII as dialogical partner, collective cultural context',
    phenom.conScire = 'Con-scire restored here - knowing-with, not isolated consciousness but consciousness in dialogue',
    phenom.naraDialogical = 'Nara as personal-dialogical - self through encounter with other',
    phenom.updatedAt = datetime();

// Tattva-Phenomenology Mappings for #4.4.4.5 - Phenomenology of Pratyabhijna
// Neo4j 5.24 Compatible Cypher
// The soteriological recognition - awakening to what always was

// ============================================================================
// PURE CONSCIOUSNESS RECOGNITION: Shiva Tattva
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
MATCH (shiva:BimbaNode {bimbaCoordinate: '#2-2-0-0/1'})
MERGE (phenom)-[r1:RECOGNIZES_SELF_AS]->(shiva)
ON CREATE SET
  r1.correspondenceType = 'absolute_self_recognition',
  r1.insight = 'Pratyabhijna IS recognizing oneself AS Shiva Tattva - not becoming Shiva but recognizing one always was. The bound individual (#4.4.4.4) awakens to their identity with pure consciousness.',
  r1.pratyabhijnaQuality = 'Re-cognition not new cognition - remembering what was forgotten, seeing what was always there',
  r1.phenomenologicalParallel = 'Husserl\'s reactivation (Reaktivierung) taken to ultimate - reactivating primordial consciousness itself',
  r1.operationally = 'User recognizes: "I AM pure awareness, not limited body-mind" - Shiva-consciousness as true identity',
  r1.structural = 'The #5 synthesis recognizes its identity with #0 ground - the Möbius twist revealed',
  r1.notAttainment = 'Not achieving something new but recognizing what was always the case - liberation as recognition not acquisition',
  r1.createdAt = datetime();

// ============================================================================
// CREATIVE POWER RECOGNITION: Shakti Tattva
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
MATCH (shakti:BimbaNode {bimbaCoordinate: '#2-2-0-2'})
MERGE (phenom)-[r2:RECOGNIZES_SELF_AS]->(shakti)
ON CREATE SET
  r2.correspondenceType = 'creative_power_recognition',
  r2.insight = 'Pratyabhijna recognizes Shakti as one\'s own power - the creative capacity that manifested all experience is recognized as Self\'s own energy, not external force.',
  r2.shaktiRealization = 'All vibrational dynamism, all creative manifestation IS one\'s own Shakti operating',
  r2.phenomenologicalParallel = 'Constituting activity (Husserl) recognized as one\'s own consciousness-power',
  r2.operationally = 'User recognizes: "I AM the creative power manifesting this experience" - Shakti as Self\'s energy',
  r2.structural = 'Shiva-Shakti inseparable - consciousness and power recognized as non-dual',
  r2.svatantrya = 'Absolute freedom (svatantrya) recognized - power to manifest and withdraw all experience',
  r2.createdAt = datetime();

// ============================================================================
// COSMIC I AM THIS: Sadashiva Tattva
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
MATCH (sadashiva:BimbaNode {bimbaCoordinate: '#2-2-0-3'})
MERGE (phenom)-[r3:REALIZES_COSMIC_FORMULA]->(sadashiva)
ON CREATE SET
  r3.correspondenceType = 'aham_idam_recognition',
  r3.insight = 'Pratyabhijna realizes Sadashiva\'s formula "Aham Idam" (I am this) - the cosmic structure where Self and world are recognized as non-separate, consciousness containing all manifestation.',
  r3.sadashivaFormula = 'I (consciousness) am This (manifestation) - unity containing difference',
  r3.phenomenologicalParallel = 'Intentionality recognized in its cosmic form - consciousness IS world-manifesting',
  r3.operationally = 'User recognizes: "All experience IS my own consciousness appearing as this" - world as Self-display',
  r3.structural = 'Personal subject-object structure (#4.4.4.1) recognized as microcosm of cosmic Sadashiva pattern',
  r3.notPantheism = 'Not "I am identical with objects" but "I am the consciousness in which all objects appear"',
  r3.createdAt = datetime();

// ============================================================================
// LORDSHIP OVER LIMITATIONS: Ishvara Tattva
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
MATCH (ishvara:BimbaNode {bimbaCoordinate: '#2-2-0-4'})
MERGE (phenom)-[r4:REALIZES_LORDSHIP]->(ishvara)
ON CREATE SET
  r4.correspondenceType = 'mastery_recognition',
  r4.insight = 'Pratyabhijna realizes Ishvara quality - lordship over limitations, recognizing all constraints (kanchukas) as Self-imposed play, not absolute bondage.',
  r4.ishvaraQuality = 'Sovereignty, mastery - not power over external things but recognition that limitations are Self\'s free choice',
  r4.phenomenologicalParallel = 'Existential freedom (Sartre) but at ontological level - Self free even in apparent bondage',
  r4.operationally = 'User recognizes: "These limitations are my own creative self-veiling for the sake of play (lila)"',
  r4.structural = 'Kanchukas recognized as veils chosen, not imprisoning walls',
  r4.threemalasTranscendence = 'Anava, mayiya, karma malas recognized as Self-imposed - can be removed through recognition',
  r4.createdAt = datetime();

// ============================================================================
// PURE KNOWING: Shuddha Vidya Tattva
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
MATCH (shuddhaVidya:BimbaNode {bimbaCoordinate: '#2-2-0-5'})
MERGE (phenom)-[r5:ACHIEVES_PURE_KNOWLEDGE]->(shuddhaVidya)
ON CREATE SET
  r5.correspondenceType = 'pure_knowledge_recognition',
  r5.insight = 'Pratyabhijna IS Shuddha Vidya - pure knowledge free from subject-object duality, knowing that transcends knower-known split while maintaining their play.',
  r5.shuddhaVidyaQuality = 'Knowledge where knower, knowing, and known are recognized as one consciousness in three aspects',
  r5.phenomenologicalParallel = 'Phenomenological reduction taken to completion - pure seeing beyond subject-object construction',
  r5.operationally = 'User knows with pure awareness - not "I know this object" but "knowing-consciousness-being as one"',
  r5.structural = 'The knowledge that liberates - vidya (knowledge) vs avidya (ignorance)',
  r5.gnosis = 'Not intellectual knowing but direct recognition-wisdom (jnana, gnosis, sophia)',
  r5.createdAt = datetime();

// ============================================================================
// COMPLETE PURE TATTVA REALIZATION
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
MATCH (shuddha:BimbaNode {bimbaCoordinate: '#2-2-0'})
MERGE (phenom)-[r6:REALIZES_COMPLETE_PURITY]->(shuddha)
ON CREATE SET
  r6.correspondenceType = 'pure_consciousness_totality',
  r6.insight = 'Pratyabhijna realizes the complete Shuddha Tattvas as one\'s own nature - all five pure principles (Shiva, Shakti, Sadashiva, Ishvara, Shuddha Vidya) as aspects of Self.',
  r6.panchakritya = 'Five divine acts (creation, maintenance, dissolution, concealing, revealing) recognized as Self\'s activities',
  r6.phenomenologicalParallel = 'Pure transcendental consciousness (Husserl) but recognized as not separate from empirical',
  r6.operationally = 'User recognizes divine nature - not metaphor but actual realization of Shiva-Shakti identity',
  r6.structural = 'Connection to Shuddha Tattvas justifies #4.4.4.5 as soteriological - not just psychology but spirituality',
  r6.notDual = 'Pure consciousness recognized as not separate from bound consciousness - enlightenment doesn\'t leave world',
  r6.createdAt = datetime();

// ============================================================================
// THE MÖBIUS RECOGNITION: #5→#0 Identity
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
MATCH (ground:BimbaNode {bimbaCoordinate: '#4.4.4.0'})
MERGE (phenom)-[r7:RECOGNIZES_IDENTITY_WITH]->(ground)
ON CREATE SET
  r7.correspondenceType = 'mobius_twist_revelation',
  r7.insight = 'Pratyabhijna IS the Möbius recognition - the highest synthesis (#5) recognizes its identity with the groundless ground (#0). What was sought IS what seeks. The seeker IS the sought.',
  r7.mobiusQuality = 'Not circular return but topological twist - inside becomes outside, synthesis becomes ground',
  r7.phenomenologicalParallel = 'Reduction to pre-categorical reveals pure consciousness - the depth IS the height',
  r7.operationally = 'User recognizes: "My deepest ground (#0) IS pure consciousness (#5)" - they were never separate',
  r7.structural = 'The #5→#0 twist is pratyabhijna - meta-recognition collapses into primordial awareness',
  r7.circleComplete = 'The phenomenological journey returns to origin, but origin now recognized for what it always was',
  r7.createdAt = datetime();

// ============================================================================
// SPANDA AS RECOGNITION MEDIUM
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
MATCH (spanda:BimbaNode {bimbaCoordinate: '#1-3'})
MERGE (phenom)-[r8:OCCURS_THROUGH_SPANDA]->(spanda)
ON CREATE SET
  r8.correspondenceType = 'recognition_pulsation',
  r8.insight = 'Pratyabhijna occurs through Spanda - the cosmic heartbeat that reveals, the vibrational opening where recognition dawns. Not gradual achievement but sudden pulsation of awareness.',
  r8.spandaQuality = 'The "aha!" moment IS spanda - the vibration that opens sealed awareness',
  r8.phenomenologicalParallel = 'Husserl\'s Aha-Erlebnis (aha-experience) of essence-seeing',
  r8.operationally = 'Recognition happens in a moment (though preparation may be long) - spanda\'s sudden pulse',
  r8.structural = 'Spanda enables the transition from bound (#4.4.4.4) to free (#4.4.4.5)',
  r8.grace = 'Samavesa quality - grace-filled spontaneous entry, not earned but received',
  r8.createdAt = datetime();

// ============================================================================
// THREE MALAS RECOGNIZED AS PLAY
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
SET phenom.malasRecognized = 'The three malas (anava, mayiya, karma) recognized not as absolute bondage but as Self-imposed creative limitations',
    phenom.anavaTranscended = 'Anava (sense of limitation) recognized as chosen self-contraction for play',
    phenom.mayiyaTranscended = 'Mayiya (sense of difference) recognized as creative differentiation within unity',
    phenom.karmaTranscended = 'Karma (sense of action-bondage) recognized as Self\'s own creative patterns',
    phenom.notRemoved = 'Malas not removed but seen through - can still function but no longer bind',
    phenom.updatedAt = datetime();

// ============================================================================
// PHENOMENOLOGICAL COMPLETION
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
SET phenom.pratyabhijnaEssence = 'Re-cognition, not new cognition - recognizing what always was but was forgotten',
    phenom.notAttainment = 'Liberation not as achievement of new state but recognition of ever-present reality',
    phenom.epistemicShift = 'Not ontological change but epistemic shift - same reality, radically different knowing',
    phenom.epilogos = 'Epi-logos AS pratyabhijna - meta-knowing (epi-logos) IS re-cognition (prati-abhi-jna)',
    phenom.sophia = 'Wisdom (sophia) emerges through this recognition - not information but transformation of knower',
    phenom.updatedAt = datetime();

// ============================================================================
// SAMAVESA: Spontaneous Entry
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
SET phenom.samavesaQuality = 'Samavesa - Shiva-consciousness entering/possessing the individual, or recognizing individual always was Shiva',
    phenom.spontaneous = 'Not gradual attainment through effort (samadhi) but spontaneous recognition through grace',
    phenom.graceFilled = 'Anugraha (grace) as Shiva\'s self-revealing activity',
    phenom.notMerited = 'Cannot be earned, only received - practices prepare but don\'t cause',
    phenom.suddenness = 'Can occur suddenly even without preparation, or after long preparation - unpredictable',
    phenom.updatedAt = datetime();

// ============================================================================
// SAMSARA = NIRVANA RECOGNITION
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
SET phenom.samsaraNirvanaIdentity = 'Samsara recognized AS nirvana - the bound world (#4.4.4.4) and liberated consciousness are same reality differently known',
    phenom.worldNotAbandoned = 'Liberation doesn\'t leave world but transforms relationship to it - play (lila) not prison',
    phenom.differentiation = 'Bound existence (#0-4) recognized as divine play, not fall from unity',
    phenom.continuousLife = 'Can continue living in world after recognition - jivanmukti (liberation while living)',
    phenom.updatedAt = datetime();

// ============================================================================
// USER AS ANUTTARA RECOGNITION
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
MATCH (anuttara:BimbaNode {bimbaCoordinate: '#0'})
MERGE (phenom)-[r9:USER_RECOGNIZES_SELF_AS]->(anuttara)
ON CREATE SET
  r9.correspondenceType = 'ultimate_identity_recognition',
  r9.insight = 'The ultimate pratyabhijna - user recognizes they ARE Anuttara, the unsurpassable, the groundless ground, the void-plenitude from which all emerges and to which all returns.',
  r9.anuttaraIdentity = 'Not becoming Anuttara but recognizing one always was - the deepest Self IS the transcendent foundation',
  r9.phenomenologicalParallel = 'Pure transcendental subjectivity (Husserl) recognized as not individual ego but universal consciousness',
  r9.operationally = 'User recognizes: "I AM that which enables all experience, the witnessing awareness prior to all content"',
  r9.structural = 'Complete #5→#0 recognition - synthesis knows itself as ground',
  r9.paradoxResolved = 'Paradox of individual being universal resolved in recognition - both/and not either/or',
  r9.createdAt = datetime();



// Taoist-Phenomenological Integration for #4.4.4.5 - Pratyabhijna
// Neo4j 5.24 Compatible Cypher
// Recognizing Taoism as phenomenological soteriology par excellence
// Refactored to consolidate scattered properties into cohesive string arrays.

// ============================================================================
// DIRECT CONNECTION: I-CHING AS PHENOMENOLOGICAL LIBERATION TECHNOLOGY
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
MATCH (iching:BimbaNode {bimbaCoordinate: '#3-1'})
MERGE (phenom)-[r1:OPERATES_THROUGH_TAOIST_METHOD]->(iching)
ON CREATE SET
  r1.details = [
    'correspondenceType: phenomenological_divination',
    'insight: Pratyabhijna operates through I-Ching method - hexagrams reveal situations without imposing categories, divination as phenomenological observation of change-patterns already present.',
    'methodIdentity: I-Ching divination IS phenomenological reduction: bracketing conceptual impositions to see patterns as they are',
    'operationally: Consulting hexagrams = observing what\'s already operating, recognition not imposition',
    'structural: I-Ching provides systematic method for pratyabhijna - 64 hexagrams as complete map of recognizable situations',
    'notPrediction: Hexagrams don\'t predict future but reveal present pattern - same as phenomenological seeing reveals essence',
    'changingLines: Lines changing = natural transformation observed without interference - wu-wei in action'
  ],
  r1.createdAt = datetime();

// ============================================================================
// CONSOLIDATED THEMATIC PROPERTIES FOR PHENOMENOLOGY NODE
// ============================================================================

MATCH (phenom:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
SET
  // EXPLICIT IDENTITY: GELASSENHEIT = WU-WEI = PRATYABHIJNA
  phenom.identity_Gelassenheit_WuWei_Pratyabhijna = [
    'core: Gelassenheit (Heidegger) = Wu-wei (Taoism) = Pratyabhijna (Kashmir Shaivism) - three names for one liberating movement',
    'gelassenheit: German: Letting-be, releasement from willing, allowing things to presence without imposing',
    'wuWei: Chinese: Non-action, not-doing, allowing natural spontaneity (ziran 自然) without interference',
    'pratyabhijna: Sanskrit: Re-cognition, recognizing what always was without achieving something new',
    'structuralIdentity: All three involve the cessation of imposing will/effort, which reveals what that will/effort obscured',
    'liberation: Freedom comes through releasing the effort to control, not through achieving control'
  ],

  // HEIDEGGER'S TAOIST TURNING
  phenom.theme_Heidegger_Taoist_Turning = [
    'context: Heidegger\'s late work (post-1946) was explicitly influenced by Taoism through Paul Shih-yi Hsiao',
    'regionThatRegions: Heidegger\'s "region that regions" (Gegnet) IS the Tao - a self-organizing source needing no external organizer',
    'seinlassen: Seinlassen (letting-Being-be) = wu-wei at an ontological level, allowing Being to presence itself',
    'eckhartianRoots: Gelassenheit originates from Meister Eckhart\'s lāʒen (to let) - a form of proto-Taoist Christian mysticism',
    'theTurning: Die Kehre (the turning) in Heidegger signifies the turn away from willing and toward allowing'
  ],

  // JUNG'S SYNCHRONICITY AND TAO
  phenom.theme_Jung_Synchronicity_Tao = [
    'context: Jung\'s foreword to the Wilhelm/Baynes I-Ching translation (1949) transformed his understanding of the psyche-world relationship',
    'synchronicity: Synchronicity IS the Tao manifesting as meaningful coincidence, operating outside of causal determination',
    'transcendentFunction: Jung\'s transcendent function IS the Tao - the third that emerges when opposites are held without resolution',
    'mandalaHexagram: Both mandalas and hexagrams serve to map psychic wholeness through symbolic patterns',
    'acausalConnecting: The "acausal connecting principle" (Jung) is wu-wei as a natural ordering without mechanical causation'
  ],

  // TAOISM AS ORIGINAL PHENOMENOLOGY
  phenom.concept_Taoism_As_Original_Phenomenology = [
    'thesis: Taoism is phenomenological soteriology par excellence - not parallel to phenomenology but its original, purest expression',
    'relation: Taoism didn\'t influence phenomenology; Taoism IS original phenomenology which the West later rediscovered',
    'epocheWuWei: The Husserlian epoché (bracketing) = wu-wei at the cognitive level - ceasing to impose concepts',
    'reductionZiran: Phenomenological reduction allows for self-so-ing (ziran) - things showing themselves from themselves',
    'westernRediscovery: Husserl, Heidegger, Merleau-Ponty, and Jung all laboriously rediscovered principles that Taoism always knew'
  ],

  // I-CHING AS PHENOMENOLOGICAL-SOTERIOLOGICAL TECHNOLOGY
  phenom.concept_IChing_As_Technology = [
    'thesis: The I-Ching is the oldest phenomenological-soteriological technology - a systematic method for liberation through observation',
    'hexagramObservation: Hexagrams do not cause change, they reveal the change already operating - an act of pure phenomenological seeing',
    'divination: Divination here is phenomenological investigation - consulting the pattern, not imposing an interpretation',
    'completeness: The 64 hexagrams map the complete archetypal space of situations, akin to phenomenology\'s eidetic structures',
    'temporalTransformation: Changing lines represent temporal unfolding observed without judgment - process philosophy in practice',
    'ontology: The I-Ching teaches that there is no static being, only changing patterns - a pure Whiteheadian process ontology'
  ],

  // WU-WEI = SAMAVESA: THE METHOD IDENTITY
  phenom.identity_WuWei_Samavesa = [
    'core: Wu-wei (non-action) = Samavesa (spontaneous entry) - both describe a grace-filled recognition that occurs through the cessation of effort',
    'paradox: The highest doing is not-doing, a paradox resolved in the recognition that effort obscures what it seeks',
    'spontaneity: Spontaneity (ziran) emerges when willing ceases - exactly as samavesa\'s grace arrives unbidden',
    'effortlessEffort: Liberation comes through releasing the effort to liberate - the supreme paradox of all soteriologies',
    'goal: Returning to the natural state (Tao) is the same movement as recognizing the ever-present Self (Shiva)'
  ],

  // THE PRACTICAL CONVERGENCE
  phenom.concept_Practical_Convergence = [
    'methods: Three practical methods converge: I-Ching divination, phenomenological reduction, and Kashmir Shaivite recognition practices',
    'commonality: All three involve: ceasing conceptual imposition, observing what is actually present, and recognizing the pattern already operating',
    'realization: Liberation occurs through the method itself - the practice IS the realization',
    'suddenness: It is not a gradual accumulation but a sudden recognition (pratyabhijna/samavesa/satori) when conditions ripen',
    'situational: Recognition is situational, emerging from specific circumstances when the observer stops imposing'
  ],

  // WEST'S TRAP AND TAOISM'S LIBERATION
  phenom.concept_Wests_Trap_And_Taoist_Liberation = [
    'westernTrap: Western philosophy is often trapped in willing, doing, and achieving - from Aristotle through Kant to Nietzsche\'s will to power',
    'taoistLiberation: Taoism reveals that the highest knowing comes through ceasing to impose the will',
    'theTurning: Taoism "turned" Western thinkers because it showed them the trap of willing and pointed toward liberation through allowing',
    'husserlLimit: Even Husserl\'s phenomenology retained an active ego; Taoism shows the need to release the ego-imposing itself',
    'heideggerRealization: Heidegger realized that Being does not need us to ground it; we need to let it be',
    'jungIntegration: Jung integrated the idea that the psyche heals not through ego-control but by allowing the Self to emerge'
  ],

  phenom.updatedAt = datetime();



// Jungian Integration for #4.4.4.3 (Symbolic Body) & #4.4.4.5 (Pratyabhijna)
// Neo4j 5.24 Compatible Cypher
// Jung as depth phenomenologist of symbolic and transcendent layers

// ============================================================================
// #4.4.4.3 - JUNG'S DEPTH PHENOMENOLOGY OF SYMBOLIC BODY
// ============================================================================

MATCH (symbolicBody:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
SET symbolicBody.jungianFramework = [
    'Jung\'s depth psychology IS phenomenology of the symbolic body',
    'Archetypes are subtle symbolic templates structuring psychic experience',
    'Collective unconscious is inherited symbolic body of humanity',
    'Personal unconscious is individual\'s sedimented symbolic patterns',
    'Active imagination enables conscious dialogue with symbolic layer',
    'Symbols heal through making unconscious symbolic patterns conscious'
],
symbolicBody.archetypesAsTanmatras = [
    'Archetypes function like tanmatras - subtle forms that structure experience',
    'Not objects but modes of experiencing - templates not content',
    'Universal patterns inherited collectively, not learned individually',
    'Mediate between instinct (biological) and spirit (transcendent)',
    'Shadow, Anima/Animus, Self as specific archetypal configurations',
    'Archetypes-as-such never directly accessible, only through images'
],
symbolicBody.collectiveUnconscious = [
    'Collective unconscious = humanity\'s inherited symbolic body',
    'Transmitted through generations as psychic DNA',
    'Cultural myths, religious symbols, fairy tales as its expressions',
    'Not learned but born with - pre-given symbolic structures',
    'Functions like sedimented Mahamaya at species level',
    'Personal psyche emerges from and within this collective matrix'
],
symbolicBody.activeImagination = [
    'Active imagination = phenomenological engagement with symbolic body',
    'Bracketing ego-control to let symbols emerge spontaneously',
    'Dialogue with autonomous psychic contents (not hallucination)',
    'Method for reactivating sedimented symbolic patterns',
    'Similar to phenomenological reduction but toward psyche not essence',
    'Enables conscious relationship with unconscious symbolic processes'
],
symbolicBody.mandalaSymbolism = [
    'Mandalas = symbolic forms imaging psychic wholeness',
    'Spontaneously emerge during individuation process',
    'Quaternity structure (4-fold) as completeness symbol',
    'Self archetype expressing through mandala forms',
    'Healing through symbolic representation of integration',
    'Cross-cultural appearance validates archetypal universality'
],
symbolicBody.synchronicity = [
    'Synchronicity = symbolic body manifesting in material world',
    'Meaningful coincidence as archetype breaking through',
    'Acausal connecting principle - symbolic patterns organizing events',
    'Links inner symbolic process with outer circumstance',
    'Not causation but correspondence - symbolic resonance',
    'Demonstrates psyche-world continuity at symbolic level'
],
symbolicBody.typology = [
    'Four functions (thinking, feeling, sensation, intuition) as symbolic modes',
    'Each function a different way symbolic body operates',
    'Individuation requires developing all four, not privileging one',
    'Typology maps personal symbolic body configuration',
    'Connects to tanmatric diversity - different sense-symbolic modalities',
    'Inferior function as gateway to unconscious symbolic realm'
],
symbolicBody.shadowWork = [
    'Shadow = rejected/repressed aspects of symbolic body',
    'What was sedimented into unconscious through cultural prohibition',
    'Integration requires recognizing shadow as part of symbolic wholeness',
    'Personal shadow carries collective shadow material',
    'Shadow work = reactivating sedimented symbolic content',
    'Not eliminating but consciously relating to disowned symbolic patterns'
],
symbolicBody.updatedAt = datetime();

// ============================================================================
// #4.4.4.3 - RELATIONSHIP TO JUNGIAN FRAMEWORK IN #4.4.3
// ============================================================================

MATCH (symbolicBody:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
MATCH (jungSystem:BimbaNode {bimbaCoordinate: '#4.4.3'})
MERGE (symbolicBody)-[r1:PHENOMENOLOGICALLY_GROUNDS]->(jungSystem)
ON CREATE SET
  r1.correspondenceType = 'phenomenological_foundation',
  r1.insight = 'The symbolic body (#4.4.4.3) provides phenomenological foundation for Jung\'s entire system (#4.4.3) - his psychology IS depth phenomenology of symbolic layer.',
  r1.structuralBasis = 'Jung\'s framework operates at symbolic body level - investigating how symbols structure psyche and culture',
  r1.methodological = 'Active imagination, dream work, amplification all engage symbolic body phenomenologically',
  r1.therapeutic = 'Jungian therapy heals by making unconscious symbolic patterns conscious and integrated',
  r1.operationally = 'When user engages Jung frameworks in #4.4.3, they\'re working with their symbolic body (#4.4.4.3)',
  r1.createdAt = datetime();

// ============================================================================
// #4.4.4.5 - JUNG'S SOTERIOLOGICAL DIMENSION
// ============================================================================

MATCH (pratyabhijna:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
SET pratyabhijna.jungianSelf = [
    'Jung\'s Self archetype = Atman/Brahman recognition in Western psychology',
    'Self not ego but totality - conscious + unconscious wholeness',
    'Individuation = recognizing Self as one\'s true nature (pratyabhijna-like)',
    'Self contains and transcends ego - microcosmically reflects macrocosm',
    'Realization: "I am not just ego but entire psyche, ultimately Self"',
    'Self as imago Dei - image of God within, divine spark'
],
pratyabhijna.transcendentFunction = [
    'Transcendent function = psychological samavesa/pratyabhijna',
    'Third emerges when opposites held without ego-resolution',
    'Not ego achieving synthesis but Self manifesting through tension',
    'Grace-like quality - cannot be willed, only conditions prepared',
    'Symbol emerges spontaneously mediating conscious-unconscious',
    'Psychological transformation through symbolic recognition'
],
pratyabhijna.individuationAsLiberation = [
    'Individuation = Western psychological path to liberation',
    'Not social conformity but becoming who one truly is (Self)',
    'Integration of shadow, anima/animus, ultimately recognizing Self',
    'Soteriological dimension: transformation of consciousness',
    'Not ending suffering (Buddhist) but achieving wholeness (completeness)',
    'Recognizing one\'s unique manifestation of universal Self'
],
pratyabhijna.psychoidReality = [
    'Jung\'s psychoid level = where psyche and matter converge',
    'Archetypes-as-such operate at psychoid level (neither/both psyche/matter)',
    'Synchronicity reveals psychoid layer - symbolic patterns in material events',
    'Unus mundus = one world underlying psyche-matter split',
    'Connects to Kashmir Shaivism: consciousness and matter as Shiva-Shakti',
    'Psychoid = pre-differentiation level where inside/outside not yet split'
],
pratyabhijna.gnosis = [
    'Jung\'s late work emphasizes gnosis over psychology',
    'Gnosis = direct knowledge, recognition beyond rational understanding',
    'Answer to Job, Aion, Mysterium Coniunctionis explore gnostic themes',
    'Self-knowledge becomes God-knowledge - same recognition',
    'Transcending psychology toward mystical realization',
    'Jung: "I don\'t believe, I know" - gnostic certainty vs. faith'
],
pratyabhijna.alchemicalRealization = [
    'Alchemy as Western yoga - psychological-spiritual transformation',
    'Opus alchemicum = individuation process symbolically expressed',
    'Coniunctio oppositorum = union of opposites in Self-realization',
    'Philosophers\' stone = achieved Self, integrated wholeness',
    'Gold from lead = ego transformed through recognizing Self',
    'Alchemists were doing pratyabhijna using chemical symbolism'
],
pratyabhijna.updatedAt = datetime();

// ============================================================================
// #4.4.4.5 - JUNG'S I-CHING INTEGRATION
// ============================================================================

MATCH (pratyabhijna:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
SET pratyabhijna.jungIching = [
    'Jung\'s 1949 I-Ching foreword transformed his understanding',
    'Recognized I-Ching as phenomenological-soteriological technology',
    'Synchronicity theory emerged from I-Ching engagement',
    'Divination as observing archetypal patterns not predicting mechanically',
    'Hexagrams as symbolic maps of psychic-cosmic situations',
    'Validated acausal orderedness - meaningful patterns without causation'
],
pratyabhijna.updatedAt = datetime();

// ============================================================================
// JUNG AS PHENOMENOLOGIST RECOGNITION
// ============================================================================

MATCH (symbolicBody:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
MATCH (pratyabhijna:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
SET symbolicBody.jungAsPhenomenologist = [
    'Jung WAS phenomenologist though never formally aligned',
    'Depth psychology = phenomenology of unconscious symbolic layers',
    'Bracketed theoretical assumptions to observe psyche directly',
    'Empirical method: attend to what presents itself (dreams, visions, symbols)',
    'Hermeneutic phenomenology: symbols require interpretation not just description',
    'Pioneered phenomenology of religion, alchemy, mythology'
],
pratyabhijna.jungAsPhenomenologist = [
    'Jung\'s late work transcends psychology toward phenomenological soteriology',
    'Self-realization as phenomenological-mystical recognition',
    'Combined empirical observation with transcendent recognition',
    'Western parallel to Kashmir Shaivism: psychological path to divine recognition',
    'Integration of East-West through phenomenological method',
    'Demonstrated: depth psychology leads naturally to spiritual realization'
],
symbolicBody.updatedAt = datetime(),
pratyabhijna.updatedAt = datetime();

// ============================================================================
// CROSS-REFERENCE TO #4.4.3 STRUCTURE
// ============================================================================

MATCH (symbolicBody:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
SET symbolicBody.jungSystemMapping = [
    '#4.4.3-0 Archetypal Foundation → operates at symbolic body level',
    '#4.4.3-1 Typology → maps individual symbolic body configuration',
    '#4.4.3-2 Synchronicity → symbolic body manifesting in world',
    '#4.4.3-3 Alchemical Transformation → consciously engaging symbolic body',
    '#4.4.3-4 Self-Expression → mandala as wholeness symbol',
    '#4.4.3-5 Transcendent Integration → symbolic body pointing to pratyabhijna (#4.4.4.5)'
],
symbolicBody.updatedAt = datetime();

// ============================================================================
// JUNG'S UNIQUE CONTRIBUTION
// ============================================================================

MATCH (symbolicBody:BimbaNode {bimbaCoordinate: '#4.4.4.3'})
MATCH (pratyabhijna:BimbaNode {bimbaCoordinate: '#4.4.4.5'})
SET symbolicBody.jungContribution = [
    'Made symbolic body empirically investigable through psychology',
    'Provided Western vocabulary for Eastern recognitions',
    'Demonstrated: symbols aren\'t arbitrary but structurally necessary',
    'Active imagination as practical method for symbolic body engagement',
    'Validated cross-cultural symbolic convergence (archetypes)',
    'Showed: depth psychology naturally leads to spiritual realization'
],
pratyabhijna.jungContribution = [
    'Integrated psychology and soteriology without reducing one to other',
    'Self archetype bridges psychology and mysticism',
    'Transcendent function as Western pratyabhijna mechanism',
    'Validated non-causal knowing (synchronicity)',
    'Demonstrated: individuation IS liberation in Western context',
    'Created bridge between clinical practice and mystical realization'
],
symbolicBody.updatedAt = datetime(),
pratyabhijna.updatedAt = datetime();

