import { useRef, useEffect } from 'react'
import GUI from 'lil-gui'
import { ShaderParameter } from '../../types'

interface ControlPanelProps {
  parameters: ShaderParameter[]
  onParameterChange: (name: string, value: any) => void
  onAddParameter: (name: string, type: 'float' | 'int' | 'bool' | 'color', defaultValue: any) => void
  onRemoveParameter: (name: string) => void
  isPlaying: boolean
  onPlayPause: () => void
  onTakeScreenshot: () => void
}

// First, add a type definition for the newParam object
type ParamConfig = {
  name: string;
  type: string;
  min: number;
  max: number;
  value: any; // Use 'any' to support different value types
};

export const ControlPanel = ({
  parameters,
  onParameterChange,
  onAddParameter,
  onRemoveParameter,
  isPlaying,
  onPlayPause,
  onTakeScreenshot
}: ControlPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const guiRef = useRef<any>(null)
  
  // Initialize the GUI
  useEffect(() => {
    if (containerRef.current && !guiRef.current) {
      try {
        // Use 'any' for the GUI instance to avoid TypeScript errors
        const gui = new GUI({ 
          container: containerRef.current, 
          title: 'Shader Controls',
          width: containerRef.current.clientWidth 
        }) as any
        
        guiRef.current = gui
        
        // Add playback controls
        const playbackFolder = gui.addFolder('Playback')
        playbackFolder.add({ play: isPlaying }, 'play')
          .name('Play/Pause')
          .onChange(() => {
            onPlayPause()
          })
        
        playbackFolder.add({ screenshot: onTakeScreenshot }, 'screenshot')
          .name('Take Screenshot')
        
        // Add parameter controls folder
        const paramsFolder = gui.addFolder('Parameters')
        
        // Add parameter creation controls with better instructions
        const newParamFolder = gui.addFolder('Add New Parameter')
        
        // Show parameter usage instructions
        const helpText = {
          info: 'After adding, use in shader as: uniform <type> <name>;'
        }
        newParamFolder.add(helpText, 'info').name('How to use').disable()
        
        // Use type annotation for newParam
        const newParam: ParamConfig = { 
          name: 'param1', 
          type: 'float', 
          min: 0, 
          max: 1,
          value: 0.5 
        }
        
        // Type-safe update function for newParam
        const updateParamDefaults = (type: string) => {
          if (type === 'float') {
            newParam.value = 0.5;
            newParam.min = 0;
            newParam.max = 1;
          } else if (type === 'int') {
            newParam.value = 1;
            newParam.min = 0;
            newParam.max = 100;
          } else if (type === 'bool') {
            // For boolean, set numeric fields to defaults but don't use them
            newParam.value = false;
            newParam.min = 0;
            newParam.max = 1;
          } else if (type === 'color') {
            // For color, set numeric fields to defaults but don't use them
            newParam.value = [1, 0, 1];
            newParam.min = 0;
            newParam.max = 1;
          }
        };
        
        // Parameter name input
        newParamFolder.add(newParam, 'name').name('Name')
          .onChange((v: string) => {
            // Ensure valid GLSL variable name (alphanumeric, starts with letter)
            const validName = v.replace(/[^a-zA-Z0-9_]/g, '')
              .replace(/^[0-9]/, 'p'); // Replace starting digit with 'p'
            
            if (validName !== v) {
              newParam.name = validName;
              // Force GUI update
              setTimeout(() => {
                if (guiRef.current) {
                  guiRef.current.controllers.forEach((c: any) => c.updateDisplay());
                }
              }, 0);
            }
          });
        
        // Parameter type selection
        newParamFolder.add(newParam, 'type', ['float', 'int', 'bool', 'color'])
          .name('Type')
          .onChange((value: string) => {
            // Update defaults based on type
            updateParamDefaults(value);
          });
        
        // Min/max only for numeric types
        const minController = newParamFolder.add(newParam, 'min', 0, 100)
          .name('Min')
          .onChange(() => {
            if (newParam.min > newParam.max) {
              newParam.min = newParam.max;
            }
          });
        
        const maxController = newParamFolder.add(newParam, 'max', 0, 100)
          .name('Max')
          .onChange(() => {
            if (newParam.max < newParam.min) {
              newParam.max = newParam.min;
            }
          });
        
        // Hide min/max for boolean and color
        const updateControllerVisibility = () => {
          const isNumeric = newParam.type === 'float' || newParam.type === 'int';
          minController.hidden(!isNumeric);
          maxController.hidden(!isNumeric);
        };
        updateControllerVisibility();
        
        // Update visibility when type changes
        newParamFolder.controllers.forEach((controller: any) => {
          if (controller.property === 'type') {
            controller.onChange(updateControllerVisibility);
          }
        });
        
        // Add parameter button
        newParamFolder.add({ add: () => {
          if (newParam.name) {
            let defaultValue: any = 0.5;
            
            if (newParam.type === 'float') {
              defaultValue = 0.5;
              // Ensure value is within range
              if (typeof newParam.min === 'number' && typeof newParam.max === 'number') {
                defaultValue = (newParam.min + newParam.max) / 2;
              }
            } else if (newParam.type === 'int') {
              defaultValue = 1;
              // Ensure value is within range
              if (typeof newParam.min === 'number' && typeof newParam.max === 'number') {
                defaultValue = Math.floor((newParam.min + newParam.max) / 2);
              }
            } else if (newParam.type === 'bool') {
              defaultValue = false;
            } else if (newParam.type === 'color') {
              defaultValue = [1, 0, 1]; // Magenta
            }
            
            onAddParameter(
              newParam.name,
              newParam.type as 'float' | 'int' | 'bool' | 'color',
              defaultValue
            );
            
            // Reset name for next parameter
            newParam.name = `param${parameters.length + 1}`;
            
            // Force GUI update
            if (guiRef.current) {
              guiRef.current.controllers.forEach((c: any) => c.updateDisplay());
            }
          }
        }}, 'add').name('Add Parameter');
        
        // Open folders
        playbackFolder.open();
        paramsFolder.open();
        newParamFolder.open();
        
        return () => {
          if (guiRef.current) {
            guiRef.current.destroy();
            guiRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error initializing control panel:', err);
      }
    }
  }, [isPlaying, onPlayPause, onTakeScreenshot, onAddParameter, parameters.length]);
  
  // Update parameters when they change
  useEffect(() => {
    if (guiRef.current) {
      try {
        // Find or create parameters folder
        let paramsFolder = guiRef.current.folders.find((folder: any) => folder.title === 'Parameters');
        
        if (!paramsFolder) {
          paramsFolder = guiRef.current.addFolder('Parameters');
          paramsFolder.open();
        }
        
        // Clear existing controls
        while (paramsFolder.controllers && paramsFolder.controllers.length > 0) {
          paramsFolder.remove(paramsFolder.controllers[0]);
        }
        
        if (parameters.length === 0) {
          // Show help text when no parameters
          paramsFolder.add({ info: 'Add parameters using the panel below' }, 'info')
            .name('No parameters yet')
            .disable();
        } else {
          // Add new controls for each parameter
          const paramValues: Record<string, any> = {};
          
          parameters.forEach(param => {
            paramValues[param.name] = param.value;
            
            let controller: any;
            
            if (param.type === 'float') {
              controller = paramsFolder.add(paramValues, param.name, param.min || 0, param.max || 1, param.step || 0.01);
            } else if (param.type === 'int') {
              controller = paramsFolder.add(paramValues, param.name, param.min || 0, param.max || 100, param.step || 1);
            } else if (param.type === 'bool') {
              controller = paramsFolder.add(paramValues, param.name);
            } else if (param.type === 'color') {
              controller = paramsFolder.addColor(paramValues, param.name);
            }
            
            if (controller) {
              controller.onChange((value: any) => {
                onParameterChange(param.name, value);
              });
              
              // Add GLSL usage hint to controller
              controller.name(`${param.name} (${param.type})`);
              
              // Add a remove button
              const removeButton = { remove: () => onRemoveParameter(param.name) };
              paramsFolder.add(removeButton, 'remove')
                .name(`Remove ${param.name}`)
                .nameTooltip(`Remove parameter "${param.name}"`);
            }
          });
        }
      } catch (err) {
        console.error('Error updating parameter controls:', err);
      }
    }
  }, [parameters, onParameterChange, onRemoveParameter]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: '100%', 
        overflowY: 'auto',
        backgroundColor: 'var(--bg-secondary)'
      }} 
    />
  );
} 