import React, { useState, ChangeEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, LockIcon, EmailIcon } from '@chakra-ui/icons';
import { FaUser } from 'react-icons/fa';
import { useAuth } from '../../auth/authContext';

// Type definitions
interface FormData {
  email: string;
  password: string;
  name: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  general?: string;
}

const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { signIn, signUp, resetPassword, loading, user } = useAuth();
  
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  // Theme colors (default to dark theme)
  const bgGradient = 'linear(to-br, gray.900, brand.900, gray.800)';
  const cardBg = 'gray.800';
  const headerBg = 'linear(to-r, brand.600, brand.700)';

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Please enter your email address';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Please enter your password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin && !formData.name) {
      newErrors.name = 'Please enter your name';
    }
    
    return newErrors;
  };

  // Form submission handler
  const handleSubmit = async (): Promise<void> => {
    const newErrors = validateForm();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        let result;
        
        if (isLogin) {
          // Sign in
          result = await signIn({
            email: formData.email,
            password: formData.password,
          });
        } else {
          // Sign up
          result = await signUp({
            email: formData.email,
            password: formData.password,
            name: formData.name,
          });
        }

        if (result.success) {
          if (isLogin) {
            toast({
              title: 'Successfully logged in',
              description: 'Redirecting to dashboard...',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
            
            // Get redirect destination (page user was trying to access, or home)
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
          } else {
            toast({
              title: 'Account created successfully',
              description: 'Please check your email for verification',
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
            setIsLogin(true);
            setFormData({ email: '', password: '', name: '' });
          }
        } else {
          setErrors({ general: result.error?.message || 'An error occurred during processing' });
        }
      } catch (error) {
        setErrors({ general: 'An unexpected error occurred' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Password reset handler
  const handleForgotPassword = async (): Promise<void> => {
    if (!formData.email) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPassword(formData.email);
      
      if (result.success) {
        toast({
          title: 'Password reset email sent',
          description: 'Please check your email',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setShowForgotPassword(false);
      } else {
        setErrors({ general: result.error?.message || 'Failed to send email' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Input field change handler
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
        general: undefined,
      }));
    }
  };

  // Toggle authentication mode
  const toggleAuthMode = (): void => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', name: '' });
    setErrors({});
    setShowForgotPassword(false);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  // Loading state display
  if (loading) {
    return (
      <Box
        minH="100vh"
        bgGradient={bgGradient}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      zIndex="1000"
    >
      <Container maxW="md">
        <Card
          bg={cardBg}
          shadow="2xl"
          borderRadius="2xl"
          overflow="hidden"
          border="1px"
          borderColor="gray.700"
        >
          {/* Header */}
          <CardHeader
            bgGradient={headerBg}
            color="white"
            textAlign="center"
            py={8}
          >
            <Center mb={4}>
              <Box
                bg="gray.800"
                borderRadius="full"
                p={4}
                shadow="lg"
                border="2px"
                borderColor="gray.600"
              >
                <Icon as={LockIcon} w={8} h={8} color="brand.400" />
              </Box>
            </Center>
            <Heading size="xl" mb={2}>
              {showForgotPassword ? 'Reset Password' : isLogin ? 'Sign In' : 'Sign Up'}
            </Heading>
          </CardHeader>

          {/* Form */}
          <CardBody p={8}>
            <VStack spacing={6}>
              {/* General error message */}
              {errors.general && (
                <Alert status="error" bg="red.900" color="white" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Name field (sign up only) */}
              {!isLogin && !showForgotPassword && (
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel htmlFor="name" color="white">Full Name</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FaUser} color="gray.400" marginTop={1.5}/>
                    </InputLeftElement>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      size="lg"
                      focusBorderColor="brand.500"
                      color="white"
                      bg="gray.700"
                      borderColor="gray.600"
                      _hover={{ borderColor: 'gray.500' }}
                      _placeholder={{ color: 'gray.400' }}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                  </InputGroup>
                  <FormErrorMessage id="name-error">
                    {errors.name}
                  </FormErrorMessage>
                </FormControl>
              )}

              {/* Email field */}
              <FormControl isInvalid={!!errors.email}>
                <FormLabel htmlFor="email" color="white">Email</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <EmailIcon color="gray.400" marginTop={1.5}/>
                  </InputLeftElement>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    size="lg"
                    focusBorderColor="brand.500"
                    color="white"
                    bg="gray.700"
                    borderColor="gray.600"
                    _hover={{ borderColor: 'gray.500' }}
                    _placeholder={{ color: 'gray.400' }}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </InputGroup>
                <FormErrorMessage id="email-error">
                  {errors.email}
                </FormErrorMessage>
              </FormControl>

              {/* Password field (hidden during password reset) */}
              {!showForgotPassword && (
                <FormControl isInvalid={!!errors.password}>
                  <FormLabel htmlFor="password" color="white">Password</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <LockIcon color="gray.400" marginTop={1.5}/>
                    </InputLeftElement>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      size="lg"
                      focusBorderColor="brand.500"
                      color="white"
                      bg="gray.700"
                      borderColor="gray.600"
                      _hover={{ borderColor: 'gray.500' }}
                      _placeholder={{ color: 'gray.400' }}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    <InputRightElement>
                      <IconButton
                        variant="ghost"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={togglePasswordVisibility}
                        size="sm"
                        tabIndex={-1}
                        marginTop={2}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage id="password-error">
                    {errors.password}
                  </FormErrorMessage>
                </FormControl>
              )}

              {/* Login options */}
              {isLogin && !showForgotPassword && (
                <Flex justify="flex-end" w="full" align="center">
                  <Link
                    color="brand.400"
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{ color: 'brand.300', textDecoration: 'underline' }}
                    onClick={() => setShowForgotPassword(true)}
                    cursor="pointer"
                  >
                    Forgot password?
                  </Link>
                </Flex>
              )}

              {/* Action button */}
              <Button
                colorScheme="brand"
                size="lg"
                w="full"
                bg="brand.600"
                color="white"
                _hover={{
                  bg: 'brand.700',
                  transform: 'translateY(-2px)',
                  shadow: 'lg'
                }}
                _active={{
                  bg: 'brand.800',
                  transform: 'translateY(0)',
                  shadow: 'md'
                }}
                transition="all 0.2s"
                onClick={showForgotPassword ? handleForgotPassword : handleSubmit}
                type="button"
                isLoading={isSubmitting}
                loadingText={showForgotPassword ? 'Sending email...' : isLogin ? 'Signing in...' : 'Creating account...'}
              >
                {showForgotPassword ? 'Send Reset Email' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>

              {/* Password reset cancel */}
              {showForgotPassword && (
                <Button
                  variant="ghost"
                  color="gray.400"
                  onClick={() => setShowForgotPassword(false)}
                  _hover={{ color: 'white' }}
                >
                  Back
                </Button>
              )}

              {/* Mode toggle */}
              {!showForgotPassword && (
                <Text textAlign="center" color="gray.400">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <Link
                    color="brand.400"
                    fontWeight="semibold"
                    ml={1}
                    onClick={toggleAuthMode}
                    _hover={{ color: 'brand.300', textDecoration: 'underline' }}
                    cursor="pointer"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </Link>
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginView;
