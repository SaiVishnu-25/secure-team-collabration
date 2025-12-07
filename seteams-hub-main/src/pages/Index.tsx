import { useState } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ActivityView } from '@/components/views/ActivityView';
import { ChatView } from '@/components/views/ChatView';
import { TeamsView } from '@/components/views/TeamsView';
import { CalendarView } from '@/components/views/CalendarView';
import { CallsView } from '@/components/views/CallsView';
import { FilesView } from '@/components/views/FilesView';
import { AppsView } from '@/components/views/AppsView';

const Index = () => {
  const [activeView, setActiveView] = useState('teams');

  const renderView = () => {
    switch (activeView) {
      case 'activity':
        return <ActivityView />;
      case 'chat':
        return <ChatView />;
      case 'teams':
        return <TeamsView />;
      case 'calendar':
        return <CalendarView />;
      case 'calls':
        return <CallsView />;
      case 'files':
        return <FilesView />;
      case 'apps':
        return <AppsView />;
      default:
        return <TeamsView />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        {renderView()}
      </div>
    </div>
  );
};

export default Index;
