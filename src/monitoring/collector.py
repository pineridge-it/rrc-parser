"""Metrics collection for ingestion pipeline."""
import time
from typing import Dict, Any, List
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import sqlite3


@dataclass
class PipelineMetrics:
    """Collected metrics from ingestion pipeline."""
    total_records_processed: int = 0
    records_per_second: float = 0.0
    error_count: int = 0
    last_success_timestamp: float = 0.0
    avg_processing_time: float = 0.0
    current_batch_size: int = 0
    failed_batches: List[str] = field(default_factory=list)


class MetricsCollector:
    """Collects metrics from various sources."""
    
    def __init__(self, db_path: str = "data/rrc_data.db"):
        """Initialize metrics collector."""
        self.db_path = db_path
    
    def collect_pipeline_metrics(self) -> PipelineMetrics:
        """Collect metrics from the ingestion pipeline database."""
        metrics = PipelineMetrics()
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get total records processed
            cursor.execute("SELECT COUNT(*) FROM permits")
            metrics.total_records_processed = cursor.fetchone()[0]
            
            # Get recent processing stats (last hour)
            hour_ago = time.time() - 3600
            cursor.execute("""
                SELECT 
                    COUNT(*) as record_count,
                    AVG(processing_time) as avg_time,
                    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
                FROM processing_log 
                WHERE timestamp > ?
            """, (hour_ago,))
            
            row = cursor.fetchone()
            if row:
                metrics.records_per_second = row[0] / 3600 if row[0] else 0
                metrics.avg_processing_time = row[1] or 0
                metrics.error_count = row[2] or 0
            
            # Get last successful run timestamp
            cursor.execute("""
                SELECT MAX(timestamp) 
                FROM processing_log 
                WHERE status = 'success'
            """)
            result = cursor.fetchone()
            if result and result[0]:
                metrics.last_success_timestamp = result[0]
            
            # Get current batch info
            cursor.execute("""
                SELECT COUNT(*) 
                FROM processing_log 
                WHERE status = 'started' 
                AND timestamp > ?
            """, (time.time() - 7200,))  # Last 2 hours
            metrics.current_batch_size = cursor.fetchone()[0] or 0
            
            # Get failed batches
            cursor.execute("""
                SELECT batch_id 
                FROM processing_log 
                WHERE status = 'error' 
                AND timestamp > ?
                LIMIT 10
            """, (time.time() - 86400,))  # Last 24 hours
            metrics.failed_batches = [row[0] for row in cursor.fetchall()]
            
            conn.close()
        except Exception as e:
            print(f"Error collecting metrics: {e}")
            # Return default metrics on error
        
        return metrics
    
    def get_data_freshness(self) -> float:
        """Get data freshness in seconds (time since last successful ingestion)."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT MAX(processed_at) 
                FROM permits
            """)
            
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                last_updated = datetime.fromisoformat(result[0])
                return (datetime.now() - last_updated).total_seconds()
            
            return float('inf')  # No data
        except Exception as e:
            print(f"Error getting data freshness: {e}")
            return float('inf')