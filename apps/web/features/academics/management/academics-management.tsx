'use client';

import { useState } from 'react';
import { BookOpen, CalendarCheck2, GraduationCap, Layers3, Shapes } from 'lucide-react';
import {
  useCreateCourseMutation,
  useCreateSchoolClassMutation,
  useCreateSubjectMutation,
  useListCoursesQuery,
  useListSchoolClassesQuery,
  useListSubjectsQuery,
  useUpdateCourseMutation,
  useUpdateSchoolClassMutation,
  useUpdateSubjectMutation,
} from '../academics.api';
import { AcademicGroupsPanel } from './academic-groups-panel';
import { CatalogPanel } from './catalog-panel';
import { BranchOfferingsPanel } from './branch-offerings-panel';

const tabs = [
  { id: 'classes', label: 'School classes', icon: GraduationCap },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'subjects', label: 'Subjects', icon: Shapes },
  { id: 'groups', label: 'Academic groups', icon: Layers3 },
  { id: 'offerings', label: 'Branch offerings', icon: CalendarCheck2 },
] as const;

export function AcademicsManagement() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('classes');
  const schoolClasses = useListSchoolClassesQuery();
  const courses = useListCoursesQuery();
  const subjects = useListSubjectsQuery();
  const [createSchoolClass] = useCreateSchoolClassMutation();
  const [updateSchoolClass] = useUpdateSchoolClassMutation();
  const [createCourse] = useCreateCourseMutation();
  const [updateCourse] = useUpdateCourseMutation();
  const [createSubject] = useCreateSubjectMutation();
  const [updateSubject] = useUpdateSubjectMutation();
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl tracking-[-.04em]">Academics</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Keep regular school classes separate from external courses, then connect groups such as
          Pre-Medical or ICS to the classes that use them.
        </p>
      </header>
      <div
        role="tablist"
        aria-label="Academic setup"
        className="flex gap-2 overflow-x-auto border-b border-border pb-3"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const selected = activeTab === id;
          return (
            <button
              key={id}
              id={`${id}-tab`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              onClick={() => setActiveTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${selected ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        {activeTab === 'classes' ? (
          <div role="tabpanel" id="classes-panel" aria-labelledby="classes-tab">
            <CatalogPanel
              itemName="School class"
              description="Create your regular school levels, from nursery through HSSC. Enable sections only for a class that needs them."
              records={schoolClasses.data ?? []}
              isLoading={schoolClasses.isLoading}
              allowCode
              allowSections
              create={(body) => createSchoolClass(body).unwrap()}
              update={(id, body) => updateSchoolClass({ id, body }).unwrap()}
            />
          </div>
        ) : null}
        {activeTab === 'courses' ? (
          <div role="tabpanel" id="courses-panel" aria-labelledby="courses-tab">
            <CatalogPanel
              itemName="Course"
              description="Courses are separate from regular school classes, for example Web Development, Python, or evening coaching."
              records={courses.data ?? []}
              isLoading={courses.isLoading}
              allowDescription
              create={(body) => createCourse(body).unwrap()}
              update={(id, body) => updateCourse({ id, body }).unwrap()}
            />
          </div>
        ) : null}
        {activeTab === 'subjects' ? (
          <div role="tabpanel" id="subjects-panel" aria-labelledby="subjects-tab">
            <CatalogPanel
              itemName="Subject"
              description="Create the subjects you will later attach to a class or course offering and use in grading."
              records={subjects.data ?? []}
              isLoading={subjects.isLoading}
              allowCode
              create={(body) => createSubject(body).unwrap()}
              update={(id, body) => updateSubject({ id, body }).unwrap()}
            />
          </div>
        ) : null}
        {activeTab === 'groups' ? (
          <div role="tabpanel" id="groups-panel" aria-labelledby="groups-tab">
            <AcademicGroupsPanel />
          </div>
        ) : null}
        {activeTab === 'offerings' ? (
          <div role="tabpanel" id="offerings-panel" aria-labelledby="offerings-tab">
            <BranchOfferingsPanel />
          </div>
        ) : null}
      </section>
    </div>
  );
}
