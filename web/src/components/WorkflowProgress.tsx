import type { WorkflowStage } from '../api/types';

interface Props {
  stages: WorkflowStage[];
  currentStageSequence: number;
}

export function WorkflowProgress({ stages, currentStageSequence }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div className="progress-track">
        {stages.map((stage, i) => {
          const done = stage.sequence < currentStageSequence;
          const current = stage.sequence === currentStageSequence;
          // A connector is "done" (filled) once we've reached or passed the stage it leads into
          const connectorDone = stage.sequence <= currentStageSequence;
          const stateClass = done ? ' done' : current ? ' current' : '';

          return (
            <div key={stage.id} className="progress-step-wrap">
              {i > 0 && (
                <div
                  className={'progress-connector' + (connectorDone ? ' done' : '')}
                />
              )}
              <div className={'progress-step' + stateClass}>
                <div className="progress-dot">
                  {done ? '✓' : stage.sequence}
                </div>
                <div className="progress-label" title={stage.name}>
                  {stage.name}
                </div>
                {stage.phaseGroup && (
                  <div className="progress-phase">{stage.phaseGroup}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
