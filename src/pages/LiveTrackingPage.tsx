import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import LiveTrackingFeed from '@/components/tracking/LiveTrackingFeed';
import DriverLocationMap from '@/components/tracking/DriverLocationMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { startDriverSimulation, stopDriverSimulation, generateRandomEvent } from '@/services/driverSimulationService';

const LiveTrackingPage = () => {
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(5000); // 5 seconds default

  // Start simulation when component mounts
  useEffect(() => {
    // Start the simulation automatically
    startDriverSimulation(simulationSpeed);
    setIsSimulationRunning(true);

    // Clean up when component unmounts
    return () => {
      stopDriverSimulation();
    };
  }, []);

  const handleToggleSimulation = () => {
    if (isSimulationRunning) {
      stopDriverSimulation();
    } else {
      startDriverSimulation(simulationSpeed);
    }
    setIsSimulationRunning(!isSimulationRunning);
  };

  const handleGenerateEvent = () => {
    generateRandomEvent();
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSimulationSpeed(newSpeed);
    if (isSimulationRunning) {
      stopDriverSimulation();
      startDriverSimulation(newSpeed);
    }
  };

  return (
    <>
      <Helmet>
        <title>Live Tracking | BiziData</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Live Tracking</h1>
            <p className="text-muted-foreground">
              Monitor driver locations and delivery status in real-time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isSimulationRunning ? "destructive" : "default"}
              onClick={handleToggleSimulation}
              className="flex items-center gap-2"
            >
              {isSimulationRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause Simulation
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Simulation
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleGenerateEvent}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Generate Event
            </Button>

            <select
              className="border rounded p-2 bg-background"
              value={simulationSpeed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
            >
              <option value={1000}>Fast (1s)</option>
              <option value={5000}>Normal (5s)</option>
              <option value={10000}>Slow (10s)</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="feed">Activity Feed</TabsTrigger>
            <TabsTrigger value="combined">Combined View</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <DriverLocationMap />
          </TabsContent>

          <TabsContent value="feed" className="space-y-6">
            <LiveTrackingFeed />
          </TabsContent>

          <TabsContent value="combined" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DriverLocationMap />
              <LiveTrackingFeed />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default LiveTrackingPage;
