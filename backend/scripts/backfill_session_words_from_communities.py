"""
Backfill session words_explored and pie_roots_discovered from existing communities.

Run this once to fix existing sessions that have communities but empty arrays.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from shared.database import Neo4jClient


async def backfill_sessions():
    """Backfill session data from communities."""

    neo4j = Neo4jClient()

    try:
        # Find all EA sessions
        query = """
        MATCH (s:EA:Session)
        RETURN s
        """

        sessions_records, _, _ = neo4j.execute_query(query)

        print(f"Found {len(sessions_records)} EA sessions")

        for record in sessions_records:
            session = dict(record["s"])
            session_id = session.get("session_id")

            if not session_id:
                continue

            # Get all communities for this session
            community_query = """
            MATCH (c:EA:Episodic)
            WHERE c.session_id = $session_id
            RETURN c
            """

            communities_records, _, _ = neo4j.execute_query(
                community_query,
                {"session_id": session_id}
            )

            if not communities_records:
                continue

            # Collect words and PIE roots from communities
            words_set = set(session.get("words_explored", []))
            pie_roots_set = set(session.get("pie_roots_discovered", []))

            for comm_record in communities_records:
                community = dict(comm_record["c"])

                # Add words
                for word in community.get("words", []):
                    words_set.add(word)

                # Add PIE root
                pie_root = community.get("pie_root")
                if pie_root:
                    pie_roots_set.add(pie_root)

            # Update session if we found new data
            if words_set or pie_roots_set:
                update_query = """
                MATCH (s:EA:Session {session_id: $session_id})
                SET s.words_explored = $words,
                    s.pie_roots_discovered = $pie_roots
                RETURN s
                """

                neo4j.execute_query(
                    update_query,
                    {
                        "session_id": session_id,
                        "words": list(words_set),
                        "pie_roots": list(pie_roots_set)
                    }
                )

                print(f"✅ Updated session {session_id}: {len(words_set)} words, {len(pie_roots_set)} PIE roots")

        print("\n🎉 Backfill complete!")

    finally:
        neo4j.close()


if __name__ == "__main__":
    asyncio.run(backfill_sessions())
