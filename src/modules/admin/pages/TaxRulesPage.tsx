'use client';
{"username":"lab_tech","fullName":"Lab Tech","email":"cshukla@synoptek.com","phone":"+918983617372","dob":"1986-12-23","gender":"MALE","password":"admin123","superuser":false,"active":true,"status":"ACTIVE","memberships":[{"hospitalId":"abe2b5e1-472a-4edb-97da-3351616f0110","roleAssignments":[{"roleCode":"LAB_TECHNICIAN","departments":["Radiology","Pathology & Laboratory"],"active":true,"assignmentId":""}],"hospitalName":"Appolo hospital"}],"labTechInfo":{"licenseNo":"Lab456","specialty":"Path"}}
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { taxService } from '@/services/taxService';
import { TaxRuleDTO, TaxGroupDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export function TaxRulesPage() {
  const [rules, setRules] = useState<TaxRuleDTO[]>([]);
  const [groups, setGroups] = useState<TaxGroupDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<TaxRuleDTO>({
    itemType: 'MEDICINE',
    hsnCode: '',
    sacCode: '',
    taxGroupId: '',
    priority: 1
  });

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [rulesRes, groupsRes] = await Promise.all([
        taxService.getAllRules(),
        taxService.getAllGroups()
      ]);
      if (rulesRes.success && rulesRes.data) setRules(rulesRes.data);
      if (groupsRes.success && groupsRes.data) setGroups(groupsRes.data);
    } catch (error) {
      console.error('Failed to fetch tax rules', error);
      triggerGlobalToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setNewRule({ itemType: 'MEDICINE', hsnCode: '', sacCode: '', taxGroupId: '', priority: 1 });
    setShowAddModal(true);
  };

  const handleOpenEdit = (rule: TaxRuleDTO) => {
    setEditingId(rule.id!);
    setNewRule({ ...rule });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax rule?')) return;
    try {
      const response = await taxService.deleteRule(id);
      if (response.success) {
        triggerGlobalToast('Tax rule deleted successfully', 'success');
        void fetchData();
      }
    } catch (error) {
      console.error('Failed to delete tax rule', error);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.taxGroupId) {
      triggerGlobalToast('Select a tax group', 'error');
      return;
    }

    try {
      const response = editingId
        ? await taxService.updateRule(editingId, newRule)
        : await taxService.createRule(newRule);

      if (response.success) {
        triggerGlobalToast(`Tax rule ${editingId ? 'updated' : 'created'} successfully`, 'success');
        setShowAddModal(false);
        void fetchData();
      } else {
        triggerGlobalToast(response.message || `Failed to ${editingId ? 'update' : 'create'} tax rule`, 'error');
      }
    } catch (error) {
      console.error(`Failed to ${editingId ? 'update' : 'create'} tax rule`, error);
      triggerGlobalToast('An error occurred', 'error');
    }
  };

  const sortedRules = React.useMemo(() => {
    return rules.toSorted((a, b) => (a.priority || 0) - (b.priority || 0));
  }, [rules]);

  return (
    <MainLayout title="Tax Rules">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tax Rules</h1>
            <p className="text-sm text-slate-500 font-medium">Map items to tax groups using Item Type, HSN, or SAC codes.</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-orange-700 hover:bg-orange-800">
            <span className="material-symbols-outlined mr-2">add</span>
            Add Tax Rule
          </Button>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Item Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">HSN/SAC</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Applied Tax Group</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    Loading tax rules...
                  </td>
                </tr>
              ) : sortedRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    No tax rules defined yet.
                  </td>
                </tr>
              ) : (
                sortedRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-400">{rule.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">
                        {rule.itemType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-800">{rule.hsnCode || rule.sacCode || 'ANY'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-orange-700">{rule.taxGroupName || groups.find(g => g.id === rule.taxGroupId)?.name || 'Unknown Group'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(rule)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-orange-600"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(rule.id!)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-red-600"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingId ? "Edit Tax Rule" : "Add Tax Rule"}
        size="lg"
      >
        <form onSubmit={handleAddRule} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Item Type</label>
              <select 
                value={newRule.itemType}
                onChange={(e) => setNewRule({ ...newRule, itemType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
              >
                <option value="MEDICINE">MEDICINE</option>
                <option value="CONSULTATION">CONSULTATION</option>
                <option value="LAB">LAB</option>
                <option value="PROCEDURE">PROCEDURE</option>
                <option value="INVENTORY">INVENTORY</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Priority</label>
              <input 
                type="number"
                value={newRule.priority}
                onChange={(e) => setNewRule({ ...newRule, priority: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                placeholder="e.g. 1"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">HSN Code (Optional)</label>
              <input 
                value={newRule.hsnCode}
                onChange={(e) => setNewRule({ ...newRule, hsnCode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                placeholder="e.g. 3004"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">SAC Code (Optional)</label>
              <input 
                value={newRule.sacCode}
                onChange={(e) => setNewRule({ ...newRule, sacCode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                placeholder="e.g. 9983"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Target Tax Group</label>
              <select 
                value={newRule.taxGroupId}
                onChange={(e) => setNewRule({ ...newRule, taxGroupId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                required
              >
                <option value="">Select a Group</option>
                {groups.filter(g => g.active).map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-orange-700 hover:bg-orange-800">Save Tax Rule</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
