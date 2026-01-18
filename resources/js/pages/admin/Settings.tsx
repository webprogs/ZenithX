import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { Setting } from '@/types';
import { getSettings, updateSettings, SettingsGrouped } from '@/api/admin/settings';
import { Cog6ToothIcon, CurrencyDollarIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsGrouped>({});
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  const fetchSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(response.data);

      // Build form default values from settings
      const defaults: Record<string, string | number | boolean> = {};
      Object.values(response.data).flat().forEach((setting) => {
        defaults[setting.key] = setting.value;
      });
      reset(defaults);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (data: Record<string, string | number | boolean>) => {
    setIsSaving(true);
    try {
      await updateSettings(data);
      toast.success('Settings saved successfully');
      fetchSettings();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'interest':
        return <CurrencyDollarIcon className="w-5 h-5" />;
      case 'withdrawal':
        return <ClockIcon className="w-5 h-5" />;
      case 'security':
        return <ShieldCheckIcon className="w-5 h-5" />;
      default:
        return <Cog6ToothIcon className="w-5 h-5" />;
    }
  };

  const getGroupTitle = (group: string) => {
    return group.charAt(0).toUpperCase() + group.slice(1).replace(/_/g, ' ') + ' Settings';
  };

  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register(setting.key)}
              className="w-5 h-5 rounded border-[#eaecef] bg-white text-[#f0b90b] focus:ring-[#f0b90b]"
            />
            <span className="text-[#1e2329]">{setting.description || setting.key}</span>
          </label>
        );
      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-[#474d57] mb-1">
              {setting.description || setting.key}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register(setting.key)}
            />
          </div>
        );
      case 'select':
        return (
          <div>
            <label className="block text-sm font-medium text-[#474d57] mb-1">
              {setting.description || setting.key}
            </label>
            <select
              {...register(setting.key)}
              className="w-full px-4 py-2 bg-white border border-[#eaecef] rounded-lg text-[#1e2329] focus:outline-none focus:ring-2 focus:ring-[#f0b90b]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        );
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-[#474d57] mb-1">
              {setting.description || setting.key}
            </label>
            <Input
              type="text"
              {...register(setting.key)}
            />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const groupOrder = ['interest', 'withdrawal', 'topup', 'security', 'general'];
  const sortedGroups = Object.keys(settings).sort(
    (a, b) => groupOrder.indexOf(a) - groupOrder.indexOf(b)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2329]">Settings</h1>
          <p className="text-[#707a8a]">Configure system settings and preferences</p>
        </div>
        {isDirty && (
          <Button onClick={handleSubmit(handleSave)} isLoading={isSaving}>
            Save Changes
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        {sortedGroups.map((group) => (
          <Card key={group}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#fef6d8] rounded-lg text-[#f0b90b]">
                  {getGroupIcon(group)}
                </div>
                <CardTitle>{getGroupTitle(group)}</CardTitle>
              </div>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settings[group].map((setting) => (
                <div key={setting.key}>{renderSettingInput(setting)}</div>
              ))}
            </div>
          </Card>
        ))}

        {Object.keys(settings).length === 0 && (
          <Card>
            <div className="text-center py-8 text-[#707a8a]">
              No settings configured yet
            </div>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSaving}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
