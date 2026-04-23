import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { client } from "@/lib/edgespark";

interface CountdownSettings {
  event_name: string;
  start_time: string;
  end_time: string;
  timezone: string;
  is_active: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<CountdownSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 获取倒计时设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await client.api.fetch('/api/public/countdown/settings');
        const result = await response.json();
        
        if (result.success) {
          setSettings(result.settings);
        }
      } catch (error) {
        console.error('Error fetching countdown settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 计算剩余时间
  useEffect(() => {
    if (!settings) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(settings.end_time).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    // 立即计算一次
    calculateTimeLeft();

    // 每秒更新
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [settings]);

  if (isLoading) {
    return (
      <div className="mt-xl bg-surface bg-opacity-10 rounded-md p-lg">
        <div className="flex items-center justify-center">
          <div className="text-sm font-body text-surface/80">Loading countdown...</div>
        </div>
      </div>
    );
  }

  if (!settings || isExpired) {
    return null; // 不显示已过期或无设置的倒计时
  }

  return (
    <div className="mt-xl bg-surface bg-opacity-10 rounded-md p-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <i className="hgi-stroke hgi-timer-01 w-4 h-4 text-surface"></i>
          <h3 className="text-base font-heading font-bold text-surface">
            {t('countdown.title', { defaultValue: 'Countdown to Submission Deadline for Open Bounty Mission' })}
          </h3>
        </div>
        
        <div className="flex items-center gap-lg">
          <div className="flex items-center gap-md">
            {/* 天数 */}
            <div className="text-center">
              <div className="text-lg font-bold text-surface font-heading">
                {timeLeft.days.toString().padStart(2, '0')}
              </div>
              <div className="text-xs font-body text-surface/80">
                {t('countdown.days', { defaultValue: 'Days' })}
              </div>
            </div>

            {/* 小时 */}
            <div className="text-center">
              <div className="text-lg font-bold text-surface font-heading">
                {timeLeft.hours.toString().padStart(2, '0')}
              </div>
              <div className="text-xs font-body text-surface/80">
                {t('countdown.hours', { defaultValue: 'Hours' })}
              </div>
            </div>

            {/* 分钟 */}
            <div className="text-center">
              <div className="text-lg font-bold text-surface font-heading">
                {timeLeft.minutes.toString().padStart(2, '0')}
              </div>
              <div className="text-xs font-body text-surface/80">
                {t('countdown.minutes', { defaultValue: 'Minutes' })}
              </div>
            </div>

            {/* 秒数 */}
            <div className="text-center">
              <div className="text-lg font-bold text-surface font-heading">
                {timeLeft.seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-xs font-body text-surface/80">
                {t('countdown.seconds', { defaultValue: 'Seconds' })}
              </div>
            </div>
          </div>
          
          <div className="text-xs font-body text-surface/70">
            {t('countdown.timezone', { defaultValue: 'All times in UTC-0' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;