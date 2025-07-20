import { useState } from 'react';
import { Link } from '@remix-run/react';
import { Plus, Clock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface BugStoriesProps {
  stories: Array<{
    id: string;
    title: string;
    author: {
      username: string;
      avatar: string;
      name: string;
    };
    priority: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    createdAt: string;
    viewsCount: number;
    isViewed: boolean;
  }>;
  currentUser: {
    avatar: string;
    username: string;
  };
}

export default function BugStories({ stories, currentUser }: BugStoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getPriorityGradient = (priority: string) => {
    switch (priority) {
      case 'critical': return 'from-red-400 to-red-600';
      case 'high': return 'from-orange-400 to-orange-600';
      case 'medium': return 'from-yellow-400 to-yellow-600';
      case 'low': return 'from-green-400 to-green-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      update: "📢",
      bug: "🐛",
      feature: "✨",
      tip: "💡",
      question: "❓",
      achievement: "🏆"
    };
    return icons[type] || "📝";
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diff = now.getTime() - created.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'now';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const visibleStories = stories.slice(currentIndex, currentIndex + 6);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
          Stories
        </h2>
      </div>

      <div className="flex space-x-4 overflow-hidden">
        {/* Your Story */}
        <Link to="/bugs/new" className="flex-shrink-0 cursor-pointer group">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-dashed border-purple-300 hover:border-purple-400 flex items-center justify-center group-hover:scale-105 transition-all duration-200">
              <Plus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-center mt-2 text-gray-600 font-medium w-16 truncate">
            Your story
          </p>
        </Link>

        {/* Stories */}
        {visibleStories.map((story) => (
          <Link
            key={story.id}
            to={`/bugs/${story.id}`}
            className="flex-shrink-0 cursor-pointer group"
          >
            <div className="relative">
              <div className={`w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr ${getPriorityGradient(story.priority)} group-hover:scale-105 transition-all duration-200`}>
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                  <img
                    src={story.author.avatar}
                    alt={story.author.username}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Type indicator */}
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <span className="text-xs">{getTypeIcon(story.type)}</span>
              </div>
              
              {/* Unread indicator */}
              {!story.isViewed && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-3 h-3 bg-purple-600 rounded-full border-2 border-white"></div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-center mt-2 text-gray-600 font-medium w-16 truncate">
              {story.author.username}
            </p>
          </Link>
        ))}

        {/* Navigation arrows */}
        {stories.length > 6 && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 6))}
              disabled={currentIndex === 0}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentIndex(Math.min(stories.length - 6, currentIndex + 6))}
              disabled={currentIndex >= stories.length - 6}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {stories.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No stories yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Be the first to share what you're working on!
          </p>
          <Link
            to="/bugs/new"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Story
          </Link>
        </div>
      )}
    </div>
  );
}