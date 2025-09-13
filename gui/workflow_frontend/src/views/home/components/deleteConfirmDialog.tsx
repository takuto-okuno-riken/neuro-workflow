import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { Project } from '../type';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  project: Project | null;
  isDeleting?: boolean;
}

export const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  project,
  isDeleting = false
}: DeleteConfirmDialogProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.600">
            ⚠️ Delete Project
          </AlertDialogHeader>

          <AlertDialogBody>
            <VStack spacing={3} align="stretch">
              <Text>
                You are about to permanently delete the following project. This action cannot be undone.
              </Text>
              
              {project && (
                <Text
                  p={3}
                  bg="red.50"
                  borderRadius="md"
                  borderLeft="4px solid"
                  borderColor="red.400"
                  fontWeight="semibold"
                  color="red.700"
                >
                  Project Name: {project.name}
                </Text>
              )}
              
              <Text fontSize="sm" color="gray.600">
                • All workflow data will be deleted
                <br />
                • Related files will also be removed
                <br />
                • This action cannot be reversed
              </Text>
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              onClick={onClose}
              isDisabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={onConfirm}
              ml={3}
              isLoading={isDeleting}
              loadingText="Deleting..."
            >
              Delete Project
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};