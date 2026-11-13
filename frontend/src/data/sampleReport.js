export const sampleReport = {
  extraction_meta: {
    filename: 'sample_cbc_lipid_panel.pdf',
    method: 'built-in sample',
    page_count: 1,
    char_count: 684,
  },
  pii_redacted_count: 0,
  analysis: {
    report_type: 'Complete Blood Count + Lipid Panel',
    overall_summary:
      'This example report includes blood cell counts and cholesterol measurements. Most values fall within the sample laboratory ranges; LDL cholesterol is slightly above the range shown here. A single result is only one part of a health picture, so a clinician can explain how these values fit your history.',
    ocr_confidence_note: null,
    biomarkers: [
      {
        test_name: 'Hemoglobin',
        category: 'Complete Blood Count',
        observed_value: '13.4',
        unit: 'g/dL',
        reference_range: '12.0–15.5 g/dL',
        status: 'normal',
        simple_explanation:
          'Hemoglobin is the protein in red blood cells that carries oxygen around the body. This example value is within the reference range printed for this sample report.',
        what_can_affect_it: ['Hydration', 'Iron and vitamin intake', 'Recent illness or activity'],
        doctor_questions: ['How does this result fit with my other blood counts?'],
      },
      {
        test_name: 'White Blood Cell Count',
        category: 'Complete Blood Count',
        observed_value: '6.8',
        unit: '×10³/µL',
        reference_range: '4.0–11.0 ×10³/µL',
        status: 'normal',
        simple_explanation:
          'White blood cells are part of the immune system and help the body respond to infections and other changes. This sample value is within the lab range shown on the report.',
        what_can_affect_it: ['Recent infections', 'Some medicines', 'Physical stress'],
        doctor_questions: ['Would a white-cell differential add useful context for me?'],
      },
      {
        test_name: 'Platelet Count',
        category: 'Complete Blood Count',
        observed_value: '248',
        unit: '×10³/µL',
        reference_range: '150–400 ×10³/µL',
        status: 'normal',
        simple_explanation:
          'Platelets are small blood components that help form clots when needed. This example result sits within the reference range printed in the sample.',
        what_can_affect_it: ['Recent illness', 'Hydration', 'Some medicines'],
        doctor_questions: ['Is this platelet result consistent with my previous reports?'],
      },
      {
        test_name: 'Total Cholesterol',
        category: 'Lipid Profile',
        observed_value: '186',
        unit: 'mg/dL',
        reference_range: '<200 mg/dL',
        status: 'normal',
        simple_explanation:
          'Total cholesterol combines several types of cholesterol carried in the blood. This sample value is below the limit printed on the example report.',
        what_can_affect_it: ['Long-term eating patterns', 'Family traits', 'Some health conditions and medicines'],
        doctor_questions: ['How should I read this alongside my HDL and LDL results?'],
      },
      {
        test_name: 'LDL Cholesterol',
        category: 'Lipid Profile',
        observed_value: '112',
        unit: 'mg/dL',
        reference_range: '<100 mg/dL',
        status: 'borderline',
        simple_explanation:
          'LDL is one type of cholesterol that carries cholesterol through the bloodstream. This example value is a little above the reference limit printed in this sample, and its meaning depends on a person’s overall health context.',
        what_can_affect_it: ['Long-term eating patterns', 'Family traits', 'Activity and other health factors'],
        doctor_questions: [
          'What LDL range is appropriate for me given my health history?',
          'Would you recommend repeating this test or reviewing it with other results?',
        ],
      },
      {
        test_name: 'HDL Cholesterol',
        category: 'Lipid Profile',
        observed_value: '54',
        unit: 'mg/dL',
        reference_range: '>40 mg/dL',
        status: 'normal',
        simple_explanation:
          'HDL is a type of cholesterol particle that carries cholesterol back toward the liver. This sample value is above the example report’s stated minimum.',
        what_can_affect_it: ['Regular activity', 'Smoking', 'Family traits'],
        doctor_questions: ['How does HDL contribute to the overall picture of my lipid panel?'],
      },
      {
        test_name: 'Triglycerides',
        category: 'Lipid Profile',
        observed_value: '118',
        unit: 'mg/dL',
        reference_range: '<150 mg/dL',
        status: 'normal',
        simple_explanation:
          'Triglycerides are a form of fat carried in the blood and used for energy. This example value is below the limit printed on the sample report.',
        what_can_affect_it: ['Recent meals', 'Alcohol intake', 'Blood sugar and other health factors'],
        doctor_questions: ['Did the timing of my last meal matter for this test?'],
      },
    ],
    general_next_steps: [
      'Use this example to see how a report can be organized; it is not a real patient result.',
      'For your own report, discuss the results and reference ranges with a clinician who knows your health history.',
    ],
  },
}
