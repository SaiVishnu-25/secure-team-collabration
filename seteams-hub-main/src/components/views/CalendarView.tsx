import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Video, 
  MapPin, 
  Clock,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Settings,
  Download,
  Copy,
  Share2,
  Link,
  CalendarDays,
  Calendar,
  FileText,
  Mail,
  CopyCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/common/UserAvatar';
import { meetings as initialMeetings, currentUser, users } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isSameDay, isToday, setHours, setMinutes } from 'date-fns';
import { Meeting } from '@/types/teams';
import { toast } from 'sonner';

type ViewMode = 'week' | 'day' | 'month';

export function CalendarView() {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [clickedTimeSlot, setClickedTimeSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showWeekends, setShowWeekends] = useState(true);
  const [showAllDayEvents, setShowAllDayEvents] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingLink: '',
    isRecurring: false,
    selectedParticipants: [] as string[],
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM

  const getMeetingsForDay = (date: Date) => {
    return meetings.filter(m => isSameDay(m.startTime, date));
  };

  const todayMeetings = getMeetingsForDay(selectedDate);

  const handlePreviousWeek = () => {
    setSelectedDate(addDays(selectedDate, -7));
  };

  const handleNextWeek = () => {
    setSelectedDate(addDays(selectedDate, 7));
  };

  const openNewMeetingDialog = (day?: Date, hour?: number) => {
    const defaultDay = day || selectedDate;
    const defaultHour = hour || 9;
    const defaultStart = setMinutes(setHours(new Date(defaultDay), defaultHour), 0);
    const defaultEnd = setMinutes(setHours(new Date(defaultDay), defaultHour + 1), 0);

    setFormData({
      title: '',
      startTime: format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
      location: '',
      meetingLink: '',
      isRecurring: false,
      selectedParticipants: [currentUser.id],
    });
    setEditingMeeting(null);
    setClickedTimeSlot(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      startTime: format(meeting.startTime, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(meeting.endTime, "yyyy-MM-dd'T'HH:mm"),
      location: meeting.location || '',
      meetingLink: meeting.meetingLink || '',
      isRecurring: meeting.isRecurring || false,
      selectedParticipants: meeting.participants.map(p => p.id),
    });
    setIsDialogOpen(true);
  };

  const handleSaveMeeting = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);

    if (endTime <= startTime) {
      toast.error('End time must be after start time');
      return;
    }

    if (formData.selectedParticipants.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    const participants = users.filter(u => formData.selectedParticipants.includes(u.id));
    const organizer = participants.find(p => p.id === currentUser.id) || currentUser;

    if (editingMeeting) {
      // Update existing meeting
      setMeetings(meetings.map(m => 
        m.id === editingMeeting.id 
          ? {
              ...m,
              title: formData.title,
              startTime,
              endTime,
              location: formData.location || undefined,
              meetingLink: formData.meetingLink || undefined,
              isRecurring: formData.isRecurring,
              participants,
              organizer,
            }
          : m
      ));
      toast.success('Meeting updated successfully');
    } else {
      // Create new meeting
      const newMeeting: Meeting = {
        id: `meet-${Date.now()}`,
        title: formData.title,
        startTime,
        endTime,
        organizer,
        participants,
        isRecurring: formData.isRecurring,
        meetingLink: formData.meetingLink || undefined,
        location: formData.location || undefined,
      };
      setMeetings([...meetings, newMeeting]);
      toast.success('Meeting created successfully');
    }

    setIsDialogOpen(false);
    setFormData({
      title: '',
      startTime: '',
      endTime: '',
      location: '',
      meetingLink: '',
      isRecurring: false,
      selectedParticipants: [],
    });
  };

  const handleDeleteMeeting = (meetingId: string) => {
    setMeetings(meetings.filter(m => m.id !== meetingId));
    if (selectedMeeting?.id === meetingId) {
      setSelectedMeeting(null);
    }
    toast.success('Meeting deleted');
  };

  const toggleParticipant = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedParticipants: prev.selectedParticipants.includes(userId)
        ? prev.selectedParticipants.filter(id => id !== userId)
        : [...prev.selectedParticipants, userId],
    }));
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    openNewMeetingDialog(day, hour);
  };

  const handleDuplicateMeeting = (meeting: Meeting) => {
    const newMeeting: Meeting = {
      ...meeting,
      id: `meet-${Date.now()}`,
      title: `${meeting.title} (Copy)`,
      startTime: addDays(meeting.startTime, 1),
      endTime: addDays(meeting.endTime, 1),
    };
    setMeetings([...meetings, newMeeting]);
    toast.success('Meeting duplicated');
  };

  const handleCopyMeetingLink = (meeting: Meeting) => {
    if (meeting.meetingLink) {
      navigator.clipboard.writeText(meeting.meetingLink);
      toast.success('Meeting link copied to clipboard');
    } else {
      toast.error('No meeting link available');
    }
  };

  const handleCopyMeetingDetails = (meeting: Meeting) => {
    const details = `Meeting: ${meeting.title}\n` +
      `Time: ${format(meeting.startTime, 'MMM d, yyyy h:mm a')} - ${format(meeting.endTime, 'h:mm a')}\n` +
      `${meeting.location ? `Location: ${meeting.location}\n` : ''}` +
      `${meeting.meetingLink ? `Link: ${meeting.meetingLink}\n` : ''}` +
      `Participants: ${meeting.participants.map(p => p.name).join(', ')}`;
    
    navigator.clipboard.writeText(details);
    toast.success('Meeting details copied to clipboard');
  };

  const handleShareMeeting = (meeting: Meeting) => {
    if (navigator.share) {
      navigator.share({
        title: meeting.title,
        text: `Meeting: ${meeting.title} on ${format(meeting.startTime, 'MMM d, yyyy')}`,
        url: meeting.meetingLink || window.location.href,
      }).catch(() => {
        handleCopyMeetingLink(meeting);
      });
    } else {
      handleCopyMeetingLink(meeting);
    }
  };

  const handleExportCalendar = () => {
    // Generate ICS file content
    const icsContent = meetings.map(meeting => {
      const formatICSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      return `BEGIN:VEVENT
UID:${meeting.id}@seteams
DTSTART:${formatICSDate(meeting.startTime)}
DTEND:${formatICSDate(meeting.endTime)}
SUMMARY:${meeting.title}
${meeting.location ? `LOCATION:${meeting.location}\n` : ''}${meeting.meetingLink ? `URL:${meeting.meetingLink}\n` : ''}DESCRIPTION:Participants: ${meeting.participants.map(p => p.name).join(', ')}
END:VEVENT`;
    }).join('\n');

    const fullICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SeTeams//Calendar//EN
${icsContent}
END:VCALENDAR`;

    // Download file
    const blob = new Blob([fullICS], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Calendar exported successfully');
  };

  const handleExportToCSV = () => {
    const csvContent = [
      ['Title', 'Start Time', 'End Time', 'Location', 'Link', 'Participants'].join(','),
      ...meetings.map(meeting => [
        `"${meeting.title}"`,
        format(meeting.startTime, 'yyyy-MM-dd HH:mm'),
        format(meeting.endTime, 'yyyy-MM-dd HH:mm'),
        `"${meeting.location || ''}"`,
        `"${meeting.meetingLink || ''}"`,
        `"${meeting.participants.map(p => p.name).join('; ')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meetings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Meetings exported to CSV');
  };

  return (
    <div className="flex-1 flex bg-background">
      {/* Calendar Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Calendar</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8"
                onClick={handlePreviousWeek}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {format(weekStart, 'MMMM yyyy')}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8"
                onClick={handleNextWeek}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
          </div>
          <Button size="sm" className="gap-2" onClick={() => openNewMeetingDialog()}>
            <Plus className="w-4 h-4" />
            New meeting
          </Button>
        </div>

        {/* Week View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b">
            <div className="w-16" /> {/* Time column spacer */}
            {weekDays.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'py-3 text-center border-l transition-colors',
                  isSameDay(day, selectedDate) && 'bg-teams-active',
                  isToday(day) && 'font-semibold'
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div className={cn(
                  'text-lg',
                  isToday(day) && 'w-8 h-8 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center'
                )}>
                  {format(day, 'd')}
                </div>
              </button>
            ))}
          </div>

          {/* Time Grid */}
          <div className="flex-1 overflow-auto teams-scrollbar">
            <div className="grid grid-cols-8 min-h-full">
              {/* Time Labels */}
              <div className="w-16">
                {hours.map((hour) => {
                  const timeDate = new Date();
                  timeDate.setHours(hour, 0, 0, 0);
                  return (
                    <div key={hour} className="h-16 border-b flex items-start justify-end pr-2 text-xs text-muted-foreground">
                      {format(timeDate, 'h a')}
                    </div>
                  );
                })}
              </div>

              {/* Day Columns */}
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="border-l relative">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      className="h-16 border-b w-full hover:bg-muted/50 transition-colors"
                      onClick={() => handleTimeSlotClick(day, hour)}
                    />
                  ))}
                  
                  {/* Meetings */}
                  {getMeetingsForDay(day).map((meeting) => {
                    const startHour = meeting.startTime.getHours();
                    const startMinute = meeting.startTime.getMinutes();
                    const endHour = meeting.endTime.getHours();
                    const endMinute = meeting.endTime.getMinutes();
                    
                    const top = ((startHour - 7) * 64) + (startMinute / 60 * 64);
                    const height = ((endHour - startHour) * 64) + ((endMinute - startMinute) / 60 * 64);

                    return (
                      <button
                        key={meeting.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMeeting(meeting);
                        }}
                        className={cn(
                          'absolute left-1 right-1 rounded px-2 py-1 text-left transition-colors overflow-hidden z-10',
                          selectedMeeting?.id === meeting.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/20 text-primary hover:bg-primary/30'
                        )}
                        style={{ top: `${top}px`, height: `${Math.max(height, 24)}px` }}
                      >
                        <p className="text-xs font-medium truncate">{meeting.title}</p>
                        {height >= 40 && (
                          <p className="text-xs opacity-80 truncate">
                            {format(meeting.startTime, 'h:mm a')}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Details Panel */}
      <div className="w-80 border-l flex flex-col">
        <div className="h-12 border-b flex items-center justify-between px-4">
          <h2 className="font-semibold">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8"
              onClick={() => openNewMeetingDialog()}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Calendar Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>View</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={viewMode === 'week'}
                    onCheckedChange={() => setViewMode('week')}
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Week View
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={viewMode === 'day'}
                    onCheckedChange={() => setViewMode('day')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Day View
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={viewMode === 'month'}
                    onCheckedChange={() => setViewMode('month')}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Month View
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Display Options</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={showWeekends}
                    onCheckedChange={setShowWeekends}
                  >
                    Show Weekends
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={showAllDayEvents}
                    onCheckedChange={setShowAllDayEvents}
                  >
                    Show All-Day Events
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportCalendar}>
                  <Download className="w-4 h-4 mr-2" />
                  Export to ICS
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportToCSV}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openNewMeetingDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Meeting
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 overflow-auto teams-scrollbar p-4">
          {todayMeetings.length > 0 ? (
            <div className="space-y-3">
              {todayMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className={cn(
                    'w-full p-3 rounded-lg border text-left transition-colors',
                    selectedMeeting?.id === meeting.id
                      ? 'border-primary bg-teams-active'
                      : 'hover:bg-teams-hover'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div 
                      className="flex items-center gap-2 flex-1 cursor-pointer" 
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      <div className="w-1 h-8 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{meeting.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(meeting.startTime, 'h:mm a')} - {format(meeting.endTime, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Meeting Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditDialog(meeting)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Meeting
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateMeeting(meeting)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleCopyMeetingLink(meeting)}>
                          <Link className="w-4 h-4 mr-2" />
                          Copy Meeting Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyMeetingDetails(meeting)}>
                          <CopyCheck className="w-4 h-4 mr-2" />
                          Copy Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareMeeting(meeting)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Meeting
                        </DropdownMenuItem>
                        {meeting.meetingLink && (
                          <DropdownMenuItem 
                            onClick={() => window.open(meeting.meetingLink, '_blank')}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Join Meeting
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Meeting
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {meeting.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {meeting.location}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {meeting.participants.slice(0, 3).map((participant) => (
                          <UserAvatar
                            key={participant.id}
                            user={participant}
                            size="sm"
                            className="border-2 border-background"
                          />
                        ))}
                      </div>
                      {meeting.participants.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{meeting.participants.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {meeting.meetingLink && (
                    <Button size="sm" className="w-full mt-3 gap-2">
                      <Video className="w-4 h-4" />
                      Join meeting
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No meetings scheduled</p>
              <Button size="sm" className="mt-4 gap-2" onClick={() => openNewMeetingDialog()}>
                <Plus className="w-4 h-4" />
                Schedule a meeting
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Meeting Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMeeting ? 'Edit Meeting' : 'Create New Meeting'}</DialogTitle>
            <DialogDescription>
              {editingMeeting ? 'Update meeting details' : 'Schedule a new meeting with your team'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                placeholder="Enter meeting title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Conference Room A, Zoom, etc."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                placeholder="https://zoom.us/j/..."
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Participants *</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`participant-${user.id}`}
                        checked={formData.selectedParticipants.includes(user.id)}
                        onCheckedChange={() => toggleParticipant(user.id)}
                      />
                      <label
                        htmlFor={`participant-${user.id}`}
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                      >
                        <UserAvatar user={user} size="sm" />
                        <span className="text-sm">{user.name}</span>
                        {user.id === currentUser.id && (
                          <span className="text-xs text-muted-foreground">(You)</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isRecurring: checked as boolean })
                }
              />
              <label htmlFor="recurring" className="text-sm cursor-pointer">
                Recurring meeting
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMeeting}>
              {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
