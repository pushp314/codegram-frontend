import { useState } from 'react';
import { Link, useLocation, useNavigate } from '@remix-run/react';
import { 
  Home, 
  Search, 
  Compass, 
  Heart, 
  MessageCircle, 
  PlusSquare, 
  User, 
  Settings,
  Code,
  FileText,
  Bug,
  Bookmark,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Home', href: '/home', icon: Home, isActive: location.pathname === '/home' },
    { name: 'Search', href: '/explore', icon: Search, isActive: location.pathname === '/explore' },
    { name: 'Explore', href: '/explore?type=trending', icon: Compass, isActive: location.pathname.startsWith('/explore') },
    { name: 'Notifications', href: '/notifications', icon: Heart, isActive: location.pathname === '/notifications' },
    { name: 'Messages', href: '/messages', icon: MessageCircle, isActive: location.pathname === '/messages' },
    { name: 'Create', href: '#', icon: PlusSquare, isActive: false, hasMenu: true },
    { name: 'Profile', href: `/u/${user.username}`, icon: User, isActive: location.pathname === `/u/${user.username}` },
  ];

  const createMenuItems = [
    { name: 'Code Snippet', href: '/snippets/new', icon: Code, description: 'Share code with syntax highlighting' },
    { name: 'Documentation', href: '/docs/new', icon: FileText, description: 'Write technical documentation' },
    { name: 'Developer Story', href: '/bugs/new', icon: Bug, description: 'Share quick updates and progress' },
  ];

  const handleCreateClick = (item: any) => {
    if (item.hasMenu) {
      setShowCreateMenu(!showCreateMenu);
    } else {
      navigate(item.href);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-5 lg:pb-4">
        <div className="flex items-center flex-shrink-0 px-6">
          <Link to="/home" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              CodeGram
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 px-3 space-y-1">
          {navigation.map((item) => (
            <div key={item.name} className="relative">
              <button
                onClick={() => handleCreateClick(item)}
                className={`group flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  item.isActive
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 transition-colors ${
                    item.isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {item.name === 'Notifications' && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                )}
              </button>

              {/* Create Menu Dropdown */}
              {item.hasMenu && showCreateMenu && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Create</h3>
                  </div>
                  {createMenuItems.map((menuItem) => (
                    <Link
                      key={menuItem.name}
                      to={menuItem.href}
                      onClick={() => setShowCreateMenu(false)}
                      className="flex items-start px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                          <menuItem.icon className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{menuItem.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{menuItem.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="flex-shrink-0 px-3">
          <div className="group block">
            <div className="flex items-center">
              <div className="relative">
                <Link to={`/u/${user.username}`}>
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-gray-100"
                    src={user.avatar}
                    alt={user.name}
                  />
                </Link>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="ml-3 flex-1">
                <Link to={`/u/${user.username}`} className="block">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-600">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </Link>
              </div>
              <div className="ml-3">
                <Link
                  to="/settings"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/home" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              CodeGram
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/notifications" className="relative p-2">
              <Heart className="w-6 h-6 text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </Link>
            <Link to="/messages" className="p-2">
              <MessageCircle className="w-6 h-6 text-gray-700" />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="text-lg font-semibold text-gray-900">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          <nav className="px-4 py-6 space-y-2">
            {navigation.filter(item => !item.hasMenu).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-xl ${
                  item.isActive
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </Link>
            ))}

            <div className="pt-4 border-t border-gray-200">
              <p className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase">Create</p>
              {createMenuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Link
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                <Settings className="mr-3 h-6 w-6" />
                Settings
              </Link>
              <button className="flex items-center w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl">
                <LogOut className="mr-3 h-6 w-6" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 pt-16 lg:pt-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          {navigation.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center p-2 ${
                item.isActive ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-6 h-6" />
            </Link>
          ))}
        </div>
      </div>

      {/* Overlay for create menu */}
      {showCreateMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCreateMenu(false)}
        />
      )}
    </div>
  );
}