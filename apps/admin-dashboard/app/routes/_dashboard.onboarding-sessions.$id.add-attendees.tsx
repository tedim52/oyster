import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import {
  Form as RemixForm,
  useActionData,
  useNavigate,
  useNavigation,
} from '@remix-run/react';
import { z } from 'zod';

import { Button, Form, getActionErrors, Modal, validateForm } from '@oyster/ui';

import { OnboardingSessionAttendeesField } from '../shared/components/onboarding-session-form';
import { Route } from '../shared/constants';
import { addOnboardingSessionAttendees, db } from '../shared/core.server';
import {
  commitSession,
  ensureUserAuthenticated,
  toast,
} from '../shared/session.server';

export async function loader({ params, request }: LoaderFunctionArgs) {
  await ensureUserAuthenticated(request, {
    allowAmbassador: true,
  });

  const onboardingSession = await db
    .selectFrom('onboardingSessions')
    .where('id', '=', params.id as string)
    .executeTakeFirst();

  if (!onboardingSession) {
    throw new Response(null, { status: 404 });
  }

  return json({});
}

const AddOnboardingSessionAttendeesInput = z.object({
  attendees: z
    .string()
    .trim()
    .min(1, { message: 'Please select at least one attendee.' })
    .transform((value) => value.split(',')),
});

type AddOnboardingSessionAttendeesInput = z.infer<
  typeof AddOnboardingSessionAttendeesInput
>;

export async function action({ params, request }: ActionFunctionArgs) {
  const session = await ensureUserAuthenticated(request, {
    allowAmbassador: true,
  });

  const form = await request.formData();

  const { data, errors } = validateForm(
    AddOnboardingSessionAttendeesInput,
    Object.fromEntries(form)
  );

  if (!data) {
    return json({
      error: 'Please fix the errors above.',
      errors,
    });
  }

  await addOnboardingSessionAttendees(params.id as string, data);

  toast(session, {
    message: `Added ${data.attendees.length} attendees.`,
    type: 'success',
  });

  return redirect(Route.ONBOARDING_SESSIONS, {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
}

const { attendees } = AddOnboardingSessionAttendeesInput.keyof().enum;

export default function AddOnboardingSessionAttendeesPage() {
  const { error, errors } = getActionErrors(useActionData<typeof action>());

  const submitting = useNavigation().state === 'submitting';

  const navigate = useNavigate();

  function onClose() {
    navigate(Route.ONBOARDING_SESSIONS);
  }

  return (
    <Modal onClose={onClose}>
      <Modal.Header>
        <Modal.Title>Add Onboarding Session Attendees</Modal.Title>
        <Modal.CloseButton />
      </Modal.Header>

      <RemixForm className="form" method="post">
        <OnboardingSessionAttendeesField
          error={errors.attendees}
          name={attendees}
        />

        <Form.ErrorMessage>{error}</Form.ErrorMessage>

        <Button.Group>
          <Button loading={submitting} type="submit">
            Upload
          </Button>
        </Button.Group>
      </RemixForm>
    </Modal>
  );
}
