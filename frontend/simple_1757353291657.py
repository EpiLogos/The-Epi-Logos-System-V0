
import asyncio
import sys
import os
import json
sys.path.append("/Users/admin/Documents/The Epi-Logos System V0/frontend")

async def main():
    try:
        from agentic.agents.agent_runner import AgentRunner
        from agentic.orchestrator.session import OrchestratorSessionManager, OrchestratorSession
        from agentic.orchestrator.conversation import ConversationManager
        # Debug environment for Redis
        import sys
        from urllib.parse import urlparse
        ru = os.getenv('REDIS_URL') or ''
        print(f"PYTHON_EXEC={sys.executable}", file=sys.stderr)
        try:
            import redis as _r
            print(f"redis_py_version={_r.__version__}", file=sys.stderr)
        except Exception:
            print("redis_py_version=unknown", file=sys.stderr)
        print(f"REDIS_URL={ru}", file=sys.stderr)
        
        # Minimal bimba client stub to satisfy tool deps
        class _BimbaClient:
            async def resolve_coordinate(self, coordinate: str):
                return {"content": None, "context": {"coordinate": coordinate}}

        # Init infra managers
        session_manager = OrchestratorSessionManager()
        conversation_manager = ConversationManager()

        # Resolve or create session
        incoming_session_id = None
        session = None
        if incoming_session_id:
            session = session_manager.get_session(incoming_session_id)
        if session is None:
            session = session_manager.create_session(user_id="web-user", persona="system")
        else:
            # Ensure persona is set per request
            session_manager.update_session(session.session_id, persona="system")
            session = session_manager.get_session(session.session_id)

        # Run agent with structured output (auto-hydrates history)
        runner = AgentRunner()
        result = await runner.run_with_structured_output(
            message="""hey remember i'm a duck hunter""",
            session=session,
            session_manager=session_manager,
            conversation_manager=conversation_manager,
            bimba_client=_BimbaClient(),
            model_name="openai:gpt-5"
        )

        # Attach session id for continuity
        result["session_id"] = session.session_id
        print(json.dumps(result, default=str))
        
    except Exception as e:
        result = {"error": f"Simple agent error: {str(e)}"}
        print(json.dumps(result, default=str))

if __name__ == "__main__":
    asyncio.run(main())
