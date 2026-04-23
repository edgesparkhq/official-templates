import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Coins, Target, ShieldAlert, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

const MissionGuidelines: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-lg bg-surface bg-opacity-10 rounded-md p-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-md text-sm font-heading font-bold text-surface hover:text-surface/80 transition-colors w-full text-left"
        aria-expanded={isExpanded}
      >
        <BookOpen className="w-4 h-4 flex-shrink-0" />
        <span>{t('introduction.rules.title')}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 ml-auto flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-md pt-md border-t border-surface/20">
          <ul className="space-y-sm text-sm font-body opacity-90">
            {(t('introduction.rules.items', { returnObjects: true }) as string[]).map((item, index) => (
              <li key={index} style={{ textIndent: '-1em', marginLeft: '1em' }}>• {item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const MaliciousSubmissionPolicy: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-md bg-surface bg-opacity-10 rounded-md p-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-md text-sm font-heading font-bold text-surface hover:text-surface/80 transition-colors w-full text-left"
        aria-expanded={isExpanded}
      >
        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
        <span>{t('maliciousPolicy.title', { defaultValue: 'Malicious Submission Policy' })}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 ml-auto flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-md pt-md border-t border-surface/20">
          <div className="bg-red-500/20 border border-red-500/30 rounded-md p-md">
            <h4 className="text-sm font-heading font-bold text-red-200 mb-sm">
              {t('maliciousPolicy.warning', { defaultValue: 'Warning: Policy on Malicious Submissions' })}
            </h4>
            <div className="text-xs font-body text-red-100/90 space-y-xs">
              <p>
                {t('maliciousPolicy.description', { defaultValue: 'User accounts found engaging in malicious submission behaviors will be directly added to the bounty mission blacklist. Such behaviors include, but are not limited to:' })}
              </p>
              <ul className="space-y-xs ml-md">
                {(t('maliciousPolicy.behaviors', { returnObjects: true, defaultValue: [
                  'Submissions that do not align with the task\'s core theme',
                  'Submitting a single work to multiple tasks',
                  'Repeatedly submitting incorrect or irrelevant projects'
                ] }) as string[]).map((behavior, index) => (
                  <li key={index}>• {behavior}</li>
                ))}
              </ul>
              <p className="text-red-200/80 text-xs italic mt-sm">
                {t('maliciousPolicy.enforcement', { defaultValue: 'This policy is enforced to ensure the fairness and efficiency of the bounty mission ecosystem.' })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BountyIntroduction: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 rounded-md p-2xl text-surface">
      <div className="text-center mb-2xl">
        <h2 className="text-2xl font-heading font-bold mb-lg">{t('introduction.title')}</h2>
        <p className="text-xl font-body opacity-90">
          {t('introduction.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-xl">
        <div className="text-center">
          <div className="bg-surface bg-opacity-20 rounded-md w-16 h-16 flex items-center justify-center mx-auto mb-lg">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-heading font-bold mb-sm">{t('introduction.steps.select.title')}</h3>
          <p className="text-sm font-body opacity-90">
            {t('introduction.steps.select.description')}
          </p>
        </div>

        <div className="text-center">
          <div className="bg-surface bg-opacity-20 rounded-md w-16 h-16 flex items-center justify-center mx-auto mb-lg">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-heading font-bold mb-sm">{t('introduction.steps.submit.title')}</h3>
          <p className="text-sm font-body opacity-90">
            {t('introduction.steps.submit.description')}
          </p>
        </div>

        <div className="text-center">
          <div className="bg-surface bg-opacity-20 rounded-md w-16 h-16 flex items-center justify-center mx-auto mb-lg">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-heading font-bold mb-sm">{t('introduction.steps.evaluate.title')}</h3>
          <p className="text-sm font-body opacity-90">
            {t('introduction.steps.evaluate.description')}
          </p>
        </div>

        <div className="text-center">
          <div className="bg-surface bg-opacity-20 rounded-md w-16 h-16 flex items-center justify-center mx-auto mb-lg">
            <Coins className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-heading font-bold mb-sm">{t('introduction.steps.reward.title')}</h3>
          <p className="text-sm font-body opacity-90">
            Winners will receive bounty rewards.Prize money will be distributed next Monday after results are announced.
          </p>
        </div>
      </div>

      <CountdownTimer />

      <MissionGuidelines />

      <MaliciousSubmissionPolicy />
    </div>
  );
};

export default BountyIntroduction;