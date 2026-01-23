import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

const Home = () => {
  useEffect(() => {
    // Load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: 'USDT-TRON',
          interval: 'D',
          timezone: 'Asia/Manila',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f0b90b',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: 'tradingview_widget',
          backgroundColor: '#ffffff',
          gridColor: '#eaecef',
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const features = [
    {
      icon: CurrencyDollarIcon,
      title: 'High Returns',
      description: 'Competitive interest rates on your crypto investments with monthly payouts.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure Platform',
      description: 'Bank-level security with multi-layer encryption to protect your assets.',
    },
    {
      icon: ClockIcon,
      title: 'Real-Time Trading',
      description: 'Access live market data and execute trades instantly 24/7.',
    },
    {
      icon: BoltIcon,
      title: 'Fast Withdrawals',
      description: 'Quick and seamless withdrawal process to crypto TRC20 or bank account.',
    },
    {
      icon: UserGroupIcon,
      title: 'Expert Support',
      description: 'Dedicated customer support team available to assist you anytime.',
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Comprehensive charts and tools to track your investment performance.',
    },
  ];

  const stats = [
    { label: 'Total Trading Volume', value: '$2.5B+' },
    { label: 'Active Users', value: '50,000+' },
    { label: 'Average Returns', value: '12% APY' },
    { label: 'Countries Supported', value: '15+' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[#eaecef] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#f0b90b] rounded-lg flex items-center justify-center">
                <span className="text-[#1e2329] font-bold text-sm sm:text-base">ZX</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-[#1e2329]">ZenithX</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/register">
                <Button variant="secondary" className="text-sm sm:text-base">Register</Button>
              </Link>
              <Link to="/login">
                <Button variant="primary" className="text-sm sm:text-base">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1e2329] mb-4 sm:mb-6">
              Your Gateway to{' '}
              <span className="text-[#f0b90b]">Crypto Wealth</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[#707a8a] max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
              Join thousands of investors earning passive income through our secure crypto trading
              platform. Start building your financial future today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-y border-[#eaecef] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e2329] mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-[#707a8a]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TradingView Chart Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e2329] mb-3 sm:mb-4">
              Live Market Data
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#707a8a] max-w-2xl mx-auto">
              Track real-time cryptocurrency prices and market trends with advanced charting tools.
            </p>
          </div>
          <Card padding="none" className="overflow-hidden">
            <div id="tradingview_widget" className="h-[400px] sm:h-[500px] lg:h-[600px]"></div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e2329] mb-3 sm:mb-4">
              Why Choose ZenithX?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#707a8a] max-w-2xl mx-auto">
              Experience the best crypto investment platform with industry-leading features and
              support.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#fef6d8] rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#f0b90b]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#1e2329] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#707a8a]">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e2329] mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#707a8a] max-w-2xl mx-auto">
              Start your investment journey in three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Get Invited',
                description:
                  'Receive an exclusive invitation code from an existing member to join our platform.',
              },
              {
                step: '02',
                title: 'Make a Deposit',
                description:
                  'Fund your account through crypto or bank transfer with flexible deposit options.',
              },
              {
                step: '03',
                title: 'Earn Returns',
                description:
                  'Watch your investment grow with monthly interest payments directly to your account.',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <Card className="h-full">
                  <div className="text-5xl sm:text-6xl font-bold text-[#f0b90b] opacity-20 mb-3 sm:mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#1e2329] mb-2 sm:mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#707a8a]">{item.description}</p>
                </Card>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-[#eaecef]"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#f0b90b] to-[#d9a60a] py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e2329] mb-3 sm:mb-4">
            Ready to Start Investing?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[#474d57] mb-6 sm:mb-8">
            Join our community of successful investors and start earning passive income today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-[#1e2329] hover:bg-[#f5f5f5] shadow-lg w-full sm:w-auto"
              >
                Create Account
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="secondary"
                size="lg"
                className="bg-[#1e2329] hover:bg-[#2b3139] shadow-lg w-full sm:w-auto"
              >
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#eaecef] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#f0b90b] rounded-lg flex items-center justify-center">
                <span className="text-[#1e2329] font-bold text-sm">ZX</span>
              </div>
              <span className="text-lg font-bold text-[#1e2329]">ZenithX</span>
            </div>
            <p className="text-xs sm:text-sm text-[#707a8a] text-center md:text-left">
              © 2026 ZenithX. All rights reserved. Crypto Investment Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Declare TradingView type for TypeScript
declare global {
  interface Window {
    TradingView: any;
  }
}

export default Home;
