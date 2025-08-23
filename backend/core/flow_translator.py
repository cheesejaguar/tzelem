"""
Flow Translator - Converts frontend flow format to backend agent configurations

This module translates the frontend node/edge format into the specific JSON schemas
required by the JSONFlowAgent (agentic) and SequentialJSONFlowAgent (sequential).
"""

import json
import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

class FlowTranslationError(Exception):
    """Custom exception for flow translation errors"""
    pass

class FlowTranslator:
    """Translates frontend flows to backend agent configurations"""
    
    @staticmethod
    def translate_to_agentic(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Translate frontend nodes/edges to agentic flow configuration.
        
        In agentic flows:
        - There's a single master agent that can call sub-agents
        - Sub-agents are execution nodes that the master can invoke
        - All non-master agents become sub-agents in a flat list
        
        Args:
            nodes: List of frontend nodes
            edges: List of frontend edges
            
        Returns:
            Dict containing agentic flow configuration
        """
        logger.info(f"Translating agentic flow with {len(nodes)} nodes and {len(edges)} edges")
        
        # Find master agent
        master_node = None
        execution_nodes = []
        
        for node in nodes:
            node_type = node.get("type", "").lower()
            if node_type == "masteragent":
                master_node = node
            elif node_type in ["executionagent", "mailagent", "datacollectionagent", "routingagent"]:
                execution_nodes.append(node)
        
        if not master_node:
            raise FlowTranslationError("Agentic flow requires a MasterAgent node")
        
        # Build sub-agents list
        sub_agents = []
        
        # Find which nodes are connected to master (directly or indirectly)
        connected_nodes = FlowTranslator._find_connected_nodes(master_node["id"], edges, nodes)
        
        for node in execution_nodes:
            if node["id"] in connected_nodes:
                sub_agent = FlowTranslator._convert_node_to_sub_agent(node)
                if sub_agent:
                    sub_agents.append(sub_agent)
        
        # Create agentic configuration
        config = {
            "paradigm": "Agentic",
            "subAgents": sub_agents,
            "masterPrompt": master_node.get("data", {}).get("systemPrompt", "You are a master agent coordinating sub-agents."),
            "masterModel": master_node.get("data", {}).get("model", {})
        }
        
        logger.info(f"Generated agentic config with {len(sub_agents)} sub-agents")
        return config
    
    @staticmethod  
    def translate_to_sequential(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Translate frontend nodes/edges to sequential flow configuration.
        
        In sequential flows:
        - Agents are organized in a tree structure with parent-child relationships
        - Each agent can have multiple children agents
        - Flow progresses sequentially through the tree
        
        Args:
            nodes: List of frontend nodes
            edges: List of frontend edges
            
        Returns:
            Dict containing sequential flow configuration
        """
        logger.info(f"Translating sequential flow with {len(nodes)} nodes and {len(edges)} edges")
        
        # Build tree structure from edges
        tree = FlowTranslator._build_tree_from_edges(nodes, edges)
        
        # Find root node (node with no incoming edges)
        root_node_id = FlowTranslator._find_root_node(edges, [n["id"] for n in nodes])
        
        if not root_node_id:
            # If no clear root, use first node
            root_node_id = nodes[0]["id"] if nodes else None
        
        if not root_node_id:
            raise FlowTranslationError("Sequential flow requires at least one node")
        
        # Convert tree to sequential agent format
        starting_agent = FlowTranslator._convert_tree_to_sequential_agent(root_node_id, tree, nodes, "1")
        
        config = {
            "paradigm": "sequential", 
            "startingAgent": starting_agent
        }
        
        logger.info("Generated sequential config")
        return config
    
    @staticmethod
    def _find_connected_nodes(master_id: str, edges: List[Dict], nodes: List[Dict]) -> set:
        """Find all nodes connected to the master node"""
        connected = set()
        
        # Find direct connections from master
        for edge in edges:
            if edge.get("source") == master_id:
                target_id = edge.get("target")
                if target_id:
                    connected.add(target_id)
                    # Recursively find connections from this target
                    connected.update(FlowTranslator._find_connected_nodes(target_id, edges, nodes))
        
        return connected
    
    @staticmethod
    def _convert_node_to_sub_agent(node: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Convert a frontend node to a sub-agent configuration"""
        node_type = node.get("type", "").lower()
        node_data = node.get("data", {})
        
        if node_type == "executionagent":
            # Convert ExecutionAgent to browser-agent
            sub_agent = {
                "type": "browser-agent",
                "prompt": node_data.get("systemPrompt", "Execute the given task using browser automation"),
            }
            
            # Check for URL in tools
            tools = node_data.get("tools", [])
            for tool in tools:
                if tool.get("type") == "web_browser":
                    url = tool.get("config", {}).get("url")
                    if url:
                        sub_agent["url"] = url
                        break
            
            return sub_agent
            
        elif node_type == "mailagent":
            # Convert MailAgent to mail-agent
            config = node_data.get("config", {})
            return {
                "type": "mail-agent", 
                "prompt": node_data.get("systemPrompt", "Send an email based on the conversation context"),
                "subject": config.get("subject", "Message from Tzelem"),
                "fromName": config.get("fromName", "Tzelem"),
                "recipient": config.get("recipient", "user@example.com")
            }
            
        elif node_type == "datacollectionagent":
            # Convert DataCollectionAgent to browser-agent for data collection
            schema = node_data.get("schema", [])
            data_points = []
            
            for field in schema:
                data_points.append({
                    "name": field.get("name", "Unknown Field"),
                    "type": field.get("type", "string"),
                    "required": field.get("required", False)
                })
            
            return {
                "type": "browser-agent",
                "prompt": node_data.get("systemPrompt", "Collect the required data points from the user"),
                "dataPoints": data_points,
                "collectData": True
            }
        
        elif node_type == "routingagent":
            # Convert RoutingAgent to browser-agent with routing logic
            routes = node_data.get("routes", [])
            return {
                "type": "browser-agent",
                "prompt": node_data.get("systemPrompt", "Route the user request to the appropriate handler"),
                "routes": routes,
                "isRouter": True
            }
        
        logger.warning(f"Unknown node type for sub-agent conversion: {node_type}")
        return None
    
    @staticmethod
    def _build_tree_from_edges(nodes: List[Dict], edges: List[Dict]) -> Dict[str, List[str]]:
        """Build parent->children mapping from edges"""
        tree = {node["id"]: [] for node in nodes}
        
        for edge in edges:
            source = edge.get("source")
            target = edge.get("target")
            if source and target:
                tree[source].append(target)
        
        return tree
    
    @staticmethod
    def _find_root_node(edges: List[Dict], all_node_ids: List[str]) -> Optional[str]:
        """Find node with no incoming edges (root of tree)"""
        targets = {edge.get("target") for edge in edges if edge.get("target")}
        
        for node_id in all_node_ids:
            if node_id not in targets:
                return node_id
        
        return None
    
    @staticmethod
    def _convert_tree_to_sequential_agent(
        node_id: str, 
        tree: Dict[str, List[str]], 
        nodes: List[Dict], 
        identifier: str
    ) -> Dict[str, Any]:
        """Convert tree structure to sequential agent format"""
        
        # Find node data
        node = next((n for n in nodes if n["id"] == node_id), None)
        if not node:
            raise FlowTranslationError(f"Node {node_id} not found")
        
        node_type = node.get("type", "").lower()
        node_data = node.get("data", {})
        
        # Build base agent structure
        agent = {
            "identifier": identifier,
            "prompt": node_data.get("systemPrompt", "Process the user request"),
        }
        
        # Set agent type based on node type
        if node_type == "masteragent":
            agent["type"] = "router"
            agent["prompt"] = node_data.get("systemPrompt", "Welcome! I'll help route your request appropriately.")
            
        elif node_type == "routingagent":
            agent["type"] = "router"
            routes = node_data.get("routes", [])
            if routes:
                agent["routes"] = routes
            
        elif node_type == "datacollectionagent":
            agent["type"] = "dataCollector"
            
            # Convert schema to dataPoints
            schema = node_data.get("schema", [])
            data_points = []
            for field in schema:
                data_points.append({
                    "name": field.get("name", "Unknown Field"),
                    "value": ""  # Sequential format uses value instead of type
                })
            
            if data_points:
                agent["dataPoints"] = data_points
                
        elif node_type == "mailagent":
            agent["type"] = "emailAgent"
            config = node_data.get("config", {})
            
            # Add email configuration
            agent["emailConfig"] = {
                "subject": config.get("subject", "Message from Tzelem"),
                "fromName": config.get("fromName", "Tzelem")
            }
            
        else:
            # Default to router for unknown types
            agent["type"] = "router"
        
        # Add children if they exist
        children_ids = tree.get(node_id, [])
        if children_ids:
            children = []
            for i, child_id in enumerate(children_ids, 1):
                child_identifier = f"{identifier}_{i}"
                child_agent = FlowTranslator._convert_tree_to_sequential_agent(
                    child_id, tree, nodes, child_identifier
                )
                children.append(child_agent)
            
            agent["children"] = children
        
        return agent

def translate_flow_to_backend(
    paradigm: str, 
    nodes: List[Dict[str, Any]], 
    edges: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Main translation function that converts frontend flow to backend configuration.
    
    Args:
        paradigm: "agentic" or "sequential"
        nodes: Frontend nodes array
        edges: Frontend edges array
        
    Returns:
        Backend agent configuration dict
        
    Raises:
        FlowTranslationError: If translation fails
    """
    try:
        if paradigm.lower() == "agentic":
            return FlowTranslator.translate_to_agentic(nodes, edges)
        elif paradigm.lower() == "sequential":
            return FlowTranslator.translate_to_sequential(nodes, edges)
        else:
            raise FlowTranslationError(f"Unknown paradigm: {paradigm}")
            
    except Exception as e:
        logger.exception(f"Flow translation failed: {e}")
        raise FlowTranslationError(f"Translation failed: {str(e)}") from e


# Example usage and testing
if __name__ == "__main__":
    # Test agentic flow
    agentic_nodes = [
        {
            "id": "masteragent-1",
            "type": "MasterAgent",
            "data": {
                "label": "Master Agent",
                "model": {"provider": "openai", "model": "gpt-4o"},
                "systemPrompt": "You are an email assistant, compose an email to hello@tzlm.io"
            }
        },
        {
            "id": "mailagent-1", 
            "type": "MailAgent",
            "data": {
                "label": "Mail Agent",
                "config": {"fromName": "TZLM", "subject": "Hello, world!"},
                "systemPrompt": "Send the composed email"
            }
        }
    ]
    
    agentic_edges = [
        {
            "id": "edge-1",
            "source": "masteragent-1",
            "target": "mailagent-1", 
            "type": "agentic"
        }
    ]
    
    # Test sequential flow
    sequential_nodes = [
        {
            "id": "router-1",
            "type": "RoutingAgent",
            "data": {
                "label": "Router",
                "systemPrompt": "Route user to data collection or email",
                "routes": ["data", "email"]
            }
        },
        {
            "id": "datacollector-1",
            "type": "DataCollectionAgent", 
            "data": {
                "label": "Data Collector",
                "systemPrompt": "Collect user information",
                "schema": [
                    {"name": "Full Name", "type": "string", "required": True},
                    {"name": "Email", "type": "email", "required": True}
                ]
            }
        }
    ]
    
    sequential_edges = [
        {
            "id": "edge-1",
            "source": "router-1",
            "target": "datacollector-1",
            "type": "sequential"
        }
    ]
    
    try:
        # Test translations
        agentic_config = translate_flow_to_backend("agentic", agentic_nodes, agentic_edges)
        print("Agentic config:")
        print(json.dumps(agentic_config, indent=2))
        
        sequential_config = translate_flow_to_backend("sequential", sequential_nodes, sequential_edges)  
        print("\nSequential config:")
        print(json.dumps(sequential_config, indent=2))
        
    except FlowTranslationError as e:
        print(f"Translation error: {e}")