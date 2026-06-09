'use client';

import {
  Box,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  type ReportFormData,
  PROBLEM_DETAILS,
  REPORT_ACTIONS,
} from './reportFormData';

interface ReportFieldsProps {
  formData: ReportFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

/**
 * The body of a maintenance report: the "problem detected" block, the list of
 * actions performed and a free-text comment. Identity and submission live in
 * the surrounding form so this can be shared across report flows.
 */
export function ReportFields({ formData, onChange }: ReportFieldsProps) {
  return (
    <>
      <Box
        sx={{
          mb: 4,
          p: 2,
          bgcolor: 'warning.50',
          borderRadius: 1,
          border: 2,
          borderColor: 'warning.main',
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              name="problemDetected"
              checked={formData.problemDetected}
              onChange={onChange}
              color="warning"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon color="warning" />
              <Typography fontWeight={600}>Problème détecté</Typography>
            </Box>
          }
        />
        {formData.problemDetected && (
          <FormGroup sx={{ pl: 4, mt: 1 }}>
            {PROBLEM_DETAILS.map(({ name, label }) => (
              <FormControlLabel
                key={name}
                control={
                  <Checkbox
                    name={name}
                    checked={formData[name]}
                    onChange={onChange}
                    color="warning"
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>
        )}
      </Box>

      <Typography variant="h6" gutterBottom>
        Actions réalisées
      </Typography>

      <FormGroup sx={{ mb: 3 }}>
        {REPORT_ACTIONS.map(({ name, label }) => (
          <FormControlLabel
            key={name}
            control={
              <Checkbox
                name={name}
                checked={formData[name]}
                onChange={onChange}
              />
            }
            label={label}
          />
        ))}
      </FormGroup>

      <TextField
        name="comment"
        label="Commentaire (optionnel)"
        value={formData.comment}
        onChange={onChange}
        multiline
        rows={4}
        fullWidth
        sx={{ mb: 3 }}
      />
    </>
  );
}
